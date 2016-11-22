import Promise from 'bluebird'

import {connect} from 'src/db'
import {processJobs} from 'src/server/util/queue'
import {getSocket} from 'src/server/util/socket'
import {getCycleById} from 'src/server/db/cycle'
import {getChapterById} from 'src/server/db/chapter'
import {getPoolById} from 'src/server/db/pool'
import fetchGoalInfo from 'src/server/actions/fetchGoalInfo'
import getCycleVotingResults from 'src/server/actions/getCycleVotingResults'

const PREFIX_NOTIFY_USER = 'notifyUser-'
const PREFIX_CYCLE_VOTING_RESULTS = 'cycleVotingResults-'

const r = connect()

export function start() {
  processJobs('newOrUpdatedVote', processVote)
}

async function processVote(vote) {
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
}

async function fetchGoalsInfo(vote) {
  const poolExpr = getPoolById(vote.poolId)
  const cycleExpr = getCycleById(poolExpr('cycleId'))
  const chapterExpr = getChapterById(cycleExpr('chapterId'))
  const goalRepositoryURL = await chapterExpr('goalRepositoryURL')
  return Promise.map(vote.notYetValidatedGoalDescriptors,
    goalDescriptor => fetchGoalInfo(goalRepositoryURL, goalDescriptor)
  )
}

function formatGoals(prefix, goals) {
  const goalLinks = goals.map((goal, i) => {
    const rank = i === 0 ? '1st' : '2nd'
    const goalIssueNum = goal.url.match(/\/(\d+)$/)[1]
    return `[(${goalIssueNum}) ${goal.title}](${goal.url}) [${rank} choice]`
  })
  return `${prefix}:\n - ${goalLinks.join('\n- ')}`
}

function validateGoalsAndNotifyUser(vote, goals) {
  const socket = getSocket()

  const invalidGoalDescriptors = vote.notYetValidatedGoalDescriptors
    .filter((goalDescriptor, i) => goals[i] === null)

  if (invalidGoalDescriptors.length > 0) {
    socket.publish(`${PREFIX_NOTIFY_USER}${vote.playerId}`, `The following goals are invalid: ${invalidGoalDescriptors.join(', ')}`)
    if (vote.goals) {
      socket.publish(`${PREFIX_NOTIFY_USER}${vote.playerId}`, formatGoals('Falling back to previous vote', vote.goals))
    }
    return false
  }

  socket.publish(`${PREFIX_NOTIFY_USER}${vote.playerId}`, formatGoals('Votes submitted for', goals))
  return true
}

function updateVote(vote) {
  const newVote = Object.assign({}, vote, {updatedAt: r.now()})
  return r.table('votes')
    .get(vote.id)
    .update(newVote)
    .run()
}

async function pushCandidateGoalsForCycle(vote) {
  const pool = await getPoolById(vote.poolId)
  const cycle = await getCycleById(pool.cycleId)
  const cycleVotingResults = await getCycleVotingResults(cycle.chapterId, cycle.id)
  const socket = getSocket()
  return socket.publish(`${PREFIX_CYCLE_VOTING_RESULTS}${cycle.id}`, cycleVotingResults)
}
