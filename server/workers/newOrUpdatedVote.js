import fetch from 'isomorphic-fetch'
import raven from 'raven'
import url from 'url'
import {graphql} from 'graphql'
import socketCluster from 'socketcluster-client'

import r from '../../db/connect'
import {getQueue} from '../util'

import rootSchema from '../graphql/rootSchema'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

const scHostname = process.env.NODE_ENV === 'development' ? 'game.learnersguild.dev' : 'game.learnersguild.org'
const socket = socketCluster.connect({hostname: scHostname})
socket.on('connect', () => console.log('... socket connected'))
socket.on('disconnect', () => console.log('socket disconnected, will try to reconnect socket ...'))
socket.on('connectAbort', () => null)
socket.on('error', error => console.warn(error.message))

function fetchGoalInfo(goalURL) {
  const fetchOpts = {
    headers: {
      Authorization: `token ${process.env.GITHUB_ORG_ADMIN_TOKEN}`,
      Accept: 'application/json',
    },
  }
  const issueURL = `https://api.github.com/repos${url.parse(goalURL).path}`
  return fetch(issueURL, fetchOpts)
    .then(resp => {
      if (!resp.ok) {
        // if the goal URL is invalid, return null so that we can notify the user of the error later
        if (resp.status === 404) {
          return null
        }
        const respBody = resp.body.read()
        const errMessage = respBody ? JSON.parse(respBody.toString()) : `FAILED: ${issueURL}`
        console.error(errMessage)
        throw new Error(`${errMessage}\n${resp.statusText}`)
      }
      return resp.json()
    })
    // if the goal URL is invalid, return null so that we can notify the user of the error later
    .then(githubIssue => ({
      url: goalURL,
      title: githubIssue ? githubIssue.title : null,
      githubIssue,
    }))
}

function fetchGoalsInfo(vote) {
  return Promise.all(vote.goals.map(goal => fetchGoalInfo(goal.url)))
}

function removeInvalidGoalsAndReportErrors(vote) {
  const invalidGoalIds = vote.goals
    .filter(goal => goal.githubIssue === null)
    .map(goal => goal.url.match(/\d+$/)[0])
  if (invalidGoalIds.length) {
    socket.publish(`notifyUser-${vote.playerId}`, `Invalid goals: ${invalidGoalIds.join(', ')}`)
  }
  vote.goals = vote.goals.filter(goal => goal.githubIssue !== null)
  return vote
}

function updateOrDeleteVote(vote) {
  const savedVote = r.table('votes').get(vote.id)
  // a vote without goals is no vote at all, so we'll delete it
  if (vote.goals.length === 0) {
    socket.publish(`notifyUser-${vote.playerId}`, 'None of the goals you voted on were valid -- your vote has been deleted.')
    return savedVote.delete().run()
  }
  // otherwise, update the vote
  const newVote = Object.assign({}, vote, {updatedAt: r.now()})
  return savedVote.update(newVote).run()
}

function pushCandidateGoalsForCycle(vote) {
  const query = `
query($cycleId: ID) {
  getCycleVotingResults(cycleId: $cycleId) {
    id
    cycle {
      id
      cycleNumber
      startTimestamp
      state
      chapter {
        id
        name
        channelName
        timezone
        goalRepositoryURL
        githubTeamId
        cycleDuration
        cycleEpoch
      }
    }
    numEligiblePlayers
    numVotes
    candidateGoals {
  		goal {
  			url
        title
      }
      playerGoalRanks {
        playerId
        goalRank
      }
    }
  }
}
  `
  const args = {cycleId: vote.cycleId}

  graphql(rootSchema, query, {currentUser: true}, args)
    .then(graphQLResult => {
      socket.publish(`cycleVotingResults-${vote.cycleId}`, graphQLResult.data.getCycleVotingResults)
    })
}

async function processVote(vote) {
  try {
    vote.goals = await fetchGoalsInfo(vote)
    const validatedVote = removeInvalidGoalsAndReportErrors(vote)
    await updateOrDeleteVote(validatedVote)
    pushCandidateGoalsForCycle(validatedVote)
  } catch (err) {
    console.error(err.stack)
    sentry.captureException(err)
  }
}

export function start() {
  const newOrUpdatedVote = getQueue('newOrUpdatedVote')
  newOrUpdatedVote.process(async ({data: vote}) => processVote(vote))
}
