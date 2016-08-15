import url from 'url'

import fetch from 'isomorphic-fetch'
import raven from 'raven'
import {graphql} from 'graphql'
import {getCycleById} from '../../server/db/cycle'
import getCycleVotingResults from '../../server/actions/getCycleVotingResults'

import r from '../../db/connect'
import {getQueue, getSocket} from '../util'

import rootSchema from '../graphql/rootSchema'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

const TEAM_SIZE_LABEL_PREFIX = 'team-size-'

// returns a Promise, resolves to null if not valid
function fetchGoalInfo(goalRepositoryURL, goalDescriptor) {
  const issueURL = githubIssueURL(goalRepositoryURL, goalDescriptor)
  if (!issueURL) {
    return Promise.resolve(null)
  }

  const fetchOptions = {
    headers: {
      Authorization: `token ${process.env.GITHUB_ORG_ADMIN_TOKEN}`,
      Accept: 'application/json',
    },
  }
  return fetch(issueURL, fetchOptions)
    .then(resp => {
      if (!resp.ok) {
        // if no issue is found at the given URL, return null
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
    // if no issue is found at the given URL, return null (notify user later)
    .then(githubIssue => (githubIssue ? {
      url: githubIssue.html_url,
      title: githubIssue.title,
      teamSize: getTeamSizeFromLabels(githubIssue.labels.map(label => label.name)),
      githubIssue,
    } : null))
}

function githubIssueURL(goalRepositoryURL, goalDescriptor) {
  const goalRepositoryURLParts = url.parse(goalRepositoryURL)
  const goalURLParts = url.parse(goalDescriptor)
  if (goalURLParts.protocol) {
    // see: http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
    const escapedGoalRepositoryURL = goalRepositoryURL.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
    const issueURLRegex = new RegExp(`^${escapedGoalRepositoryURL}\/issues\/\\d+$`)
    if (goalDescriptor.match(issueURLRegex)) {
      return `https://api.github.com/repos${goalURLParts.path}`
    }
  } else if (goalDescriptor.match(/^\d+$/)) {
    return `https://api.github.com/repos${goalRepositoryURLParts.path}/issues/${goalDescriptor}`
  }
}

function fetchGoalsInfo(vote) {
  // get the cycle (which has a nested chapter) so that we have access to
  // the goalRepositoryURL, pass in that goalRepositoryURL to fetchGoalInfo
  const query = `
query($id: ID!) {
  getCycleById(id: $id) {
    id
    chapter {
      goalRepositoryURL
    }
  }
}
  `
  const args = {id: vote.cycleId}

  return graphql(rootSchema, query, {currentUser: true}, args)
    .then(graphQLResult => {
      const {goalRepositoryURL} = graphQLResult.data.getCycleById.chapter
      const promises = vote.notYetValidatedGoalDescriptors
        .map(goalDescriptor => fetchGoalInfo(goalRepositoryURL, goalDescriptor))
      return Promise.all(promises)
    })
}

function formatGoals(prefix, goals) {
  const goalLinks = goals.map((goal, i) => {
    const rank = i === 0 ? '1st' : '2nd'
    const goalIssueNum = goal.url.match(/\/(\d+)$/)[1]
    return `[(${goalIssueNum}) ${goal.title}](${goal.url}) [${rank} choice]`
  })
  return `${prefix}:\n - ${goalLinks.join('\n- ')}`
}

function getTeamSizeFromLabels(labels) {
  const teamSizeLabel = (labels || []).find(label => (label || '').toLowerCase().startsWith(TEAM_SIZE_LABEL_PREFIX))
  return teamSizeLabel ? parseInt(teamSizeLabel.split(TEAM_SIZE_LABEL_PREFIX)[1], 10) : null
}

function validateGoalsAndNotifyUser(vote, goals) {
  const socket = getSocket()

  const invalidGoalDescriptors = vote.notYetValidatedGoalDescriptors
    .filter((goalDescriptor, i) => goals[i] === null)
  if (invalidGoalDescriptors.length) {
    socket.publish(`notifyUser-${vote.playerId}`, `The following goals are invalid: ${invalidGoalDescriptors.join(', ')}`)
    if (vote.goals) {
      socket.publish(`notifyUser-${vote.playerId}`, formatGoals('Falling back to previous vote', vote.goals))
    }
    return false
  }
  socket.publish(`notifyUser-${vote.playerId}`, formatGoals('Votes submitted for', goals))
  return true
}

function updateVote(vote) {
  const newVote = Object.assign({}, vote, {updatedAt: r.now()})
  return r.table('votes')
    .get(vote.id)
    .update(newVote)
    .run()
}

function pushCandidateGoalsForCycle(vote) {
  return getCycleById(vote.cycleId)
    .then(cycle => {
      return getCycleVotingResults(cycle.chapterId, cycle.id)
    })
    .then(cycleVotingResults => {
      const socket = getSocket()
      return socket.publish(`cycleVotingResults-${vote.cycleId}`/* + `-${getPoolIdForPlayer(vote.playerId, vote.cycleId)}`*/, cycleVotingResults)
    })
}

async function processVote(vote) {
  try {
    const goals = await fetchGoalsInfo(vote)
    const validatedVote = Object.assign({}, vote, {
      pendingValidation: false,
      notYetValidatedGoalDescriptors: null,
    })
    if (validateGoalsAndNotifyUser(vote, goals)) {
      validatedVote.goals = goals
    }
    await updateVote(validatedVote)
    await pushCandidateGoalsForCycle(validatedVote)
  } catch (err) {
    console.error(err.stack)
    sentry.captureException(err)
  }
}

export function start() {
  const newOrUpdatedVote = getQueue('newOrUpdatedVote')
  newOrUpdatedVote.process(async ({data: vote}) => processVote(vote))
}
