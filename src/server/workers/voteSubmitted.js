import Promise from 'bluebird'

import {Cycle, Pool, Vote, r} from 'src/server/services/dataService'
import {getGoalInfo} from 'src/server/services/goalLibraryService'
import getCycleVotingResults from 'src/server/actions/getCycleVotingResults'

export default function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('voteSubmitted', processVoteSubmitted)
}

async function processVoteSubmitted(vote) {
  const goals = await fetchGoalsInfo(vote)
  const goalDescriptorIsInvalid = (goalDescriptor, i) => goals[i] === null

  const invalidGoalDescriptors = vote.notYetValidatedGoalDescriptors
    .filter(goalDescriptorIsInvalid)

  let validatedVote
  if (invalidGoalDescriptors.length === 0) {
    validatedVote = {
      ...vote, goals,
      invalidGoalDescriptors: null,
    }
  } else {
    validatedVote = {
      ...vote,
      invalidGoalDescriptors: vote.notYetValidatedGoalDescriptors,
    }
  }

  await updateValidatedVote(validatedVote)
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
  if (!vote.responseURL) {
    return
  }

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

function updateValidatedVote(vote) {
  return Vote
    .get(vote.id)
    .replace(row => (
      row.merge({
        ...vote,
        pendingValidation: false,
        updatedAt: r.now(),
      })
      .without('notYetValidatedGoalDescriptors')
    ))
}

async function pushCandidateGoalsForCycle(vote) {
  const notificationService = require('src/server/services/notificationService')

  const pool = await Pool.get(vote.poolId)
  const cycle = await Cycle.get(pool.cycleId)
  const cycleVotingResults = await getCycleVotingResults(cycle.chapterId, cycle.id)
  return notificationService.notify(`cycleVotingResults-${cycle.id}`, cycleVotingResults)
}
