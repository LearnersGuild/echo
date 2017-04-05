import Promise from 'bluebird'

import {connect} from 'src/db'
import {getCycleById} from 'src/server/db/cycle'
import {getPoolById} from 'src/server/db/pool'
import {getGoalInfo} from 'src/server/services/goalLibraryService'
import getCycleVotingResults from 'src/server/actions/getCycleVotingResults'

const r = connect()

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('voteSubmitted', processVoteSubmitted)
}

async function processVoteSubmitted(vote) {
  const goals = await fetchGoalsInfo(vote)
  const goalDescriptorIsInvalid = (goalDescriptor, i) => goals[i] === null

  const invalidGoalDescriptors = vote.notYetValidatedGoalDescriptors
    .filter(goalDescriptorIsInvalid)

  const validatedVote = invalidGoalDescriptors.length > 0 ? {
    ...vote,
    invalidGoalDescriptors: vote.notYetValidatedGoalDescriptors,
  } : {
    ...vote,
    invalidGoalDescriptors: null,
    goals,
  }

  await updateVote(validatedVote)
  await pushCandidateGoalsForCycle(validatedVote)
  notifyUser(validatedVote)
}

async function fetchGoalsInfo(vote) {
  return Promise.map(vote.notYetValidatedGoalDescriptors,
    goalDescriptor => getGoalInfo(goalDescriptor)
  )
}

function formatGoals(goals) {
  return goals.map((goal, i) => {
    const rank = i === 0 ? '1st' : '2nd'
    return {
      title: `${goal.number}: ${goal.title} [${rank} choice]`,
      title_link: goal.url, // eslint-disable-line camelcase
    }
  })
}

function notifyUser(vote) {
  const chatService = require('src/server/services/chatService')

  if (vote.invalidGoalDescriptors && vote.invalidGoalDescriptors.length > 0) {
    chatService.sendResponseMessage(vote.responseURL, {
      text: `The following goals are invalid: ${vote.invalidGoalDescriptors.join(', ')}`,
    })
    if (vote.goals) {
      chatService.sendResponseMessage(vote.responseURL, {
        text: 'Falling back to previous vote',
        attachments: formatGoals(vote.goals),
      })
    }
  } else {
    chatService.sendResponseMessage(vote.responseURL, {
      text: 'Votes submitted for',
      attachments: formatGoals(vote.goals),
    })
  }
}

function updateVote(vote) {
  return r.table('votes')
    .get(vote.id)
    .replace(
      r.row
        .merge({
          ...vote,
          pendingValidation: false,
          updatedAt: r.now()
        })
        .without('notYetValidatedGoalDescriptors')
    )
}

async function pushCandidateGoalsForCycle(vote) {
  const notificationService = require('src/server/services/notificationService')

  const pool = await getPoolById(vote.poolId)
  const cycle = await getCycleById(pool.cycleId)
  const cycleVotingResults = await getCycleVotingResults(cycle.chapterId, cycle.id)
  return notificationService.notify(`cycleVotingResults-${cycle.id}`, cycleVotingResults)
}
