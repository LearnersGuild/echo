import {graphql} from 'graphql'

import randomMemorableName from '../../common/util/randomMemorableName'
import r from '../../db/connect'
import rootSchema from '../graphql/rootSchema'
import {graphQLErrorHandler} from '../../common/util/getGraphQLFetcher'

export async function formProjectTeams(cycleId) {
  // TODO: this doesn't consider existing projects that span multiple cycles
  try {
    const votingResults = await getCycleVotingResults(cycleId)
    const chapterPlayers = await r.table('players').getAll(votingResults.cycle.chapter.id, {index: 'chapterId'}).run()

    const projects = buildProjects(votingResults, chapterPlayers)

    return r.table('projects').insert(projects).run().then(() => projects)
  } catch (e) {
    // TODO: log this?
    throw (e)
  }
}

function getCycleVotingResults(cycleId) {
  const query = `
    query($cycleId: ID!) {
      getCycleVotingResults(cycleId: $cycleId) {
        id
        cycle {
          id
          chapter {
            id
            name
            channelName
          }
        }
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

  return graphql(rootSchema, query, {currentUser: true}, {cycleId})
    .then(graphQLErrorHandler)
    .then(results => results.data.getCycleVotingResults)
}

function buildProjects(votingResults, chapterPlayers) {
  const teamSizes = getTeamSizes(chapterPlayers.length)
  const candidateGoals = votingResults.candidateGoals.slice(0, teamSizes.length)

  // TODO:
  //   * prefer to assign voters to goals they voted for
  //   * use very popular goals for more than one project

  const now = new Date()
  return candidateGoals.map((candidateGoal, i) => {
    const teamPlayers = chapterPlayers.splice(0, teamSizes[i])
    return {
      goal: {
        url: candidateGoal.goal.url,
        title: candidateGoal.goal.title,
      },
      // TODO: add unique index on this name
      name: randomMemorableName(),
      chapterId: votingResults.cycle.chapter.id,
      cycleTeams: {
        [votingResults.cycle.id]: {playerIds: teamPlayers.map(p => p.id)}
      },
      createdAt: now,
      updatedAt: now,
    }
  })
}

function getTeamSizes(playerCount, target = 4) {
  // Note: this algorithm is imperfect and may
  // not work if the initial target isn't 4
  const absoluteMinumum = 3
  const min = target - 1

  const div = Math.floor(playerCount / target)
  const remainder = playerCount % target

  if (remainder === 0) {
    return Array.from({length: div}, () => target)
  }

  if (remainder >= min) {
    const perfectTeams = Array.from({length: div}, () => target)
    return perfectTeams.concat(remainder)
  }

  if (remainder < min && div >= remainder) {
    const perfectTeams = Array.from({length: div - remainder}, () => target)
    const largerTeams = Array.from({length: remainder}, () => target + 1)
    return perfectTeams.concat(...largerTeams)
  }

  if (target > absoluteMinumum) {
    return getTeamSizes(playerCount, target - 1)
  }

  throw new Error('I cannot figure what the team sizes should be!')
}
export const _forTesting_ = {getTeamSizes}
