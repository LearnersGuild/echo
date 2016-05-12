import fields from '../query'
import r from '../../../../../db/connect'
import factory from '../../../../../test/factories'
import Spec from '../../../../../test/helpers/Spec'
import {runGraphQLQuery} from '../../../../../test/graphql-helpers'

class GetCycleVotingResultsSpec extends Spec {

  async given() {
    const state = this.state

    state.chapter = await factory.create('chapter')
    state.cycle = await factory.create('cycle', {chapterId: state.chapter.id, state: 'GOAL_SELECTION'})
    state.eligiblePlayers = await factory.createMany('player', {chapterId: state.chapter.id}, 3)

    state.firstPlaceGoalNumber = 1
    state.secondPlaceGoalNumber = 2
    state.thirdPlaceGoalNumber = 3

    state.goalNumberVotes = [
      [state.firstPlaceGoalNumber, state.secondPlaceGoalNumber],
      [state.firstPlaceGoalNumber, state.secondPlaceGoalNumber],
      [state.firstPlaceGoalNumber, state.thirdPlaceGoalNumber],
    ]

    state.votes = await Promise.all(
      state.goalNumberVotes.map(([goal1, goal2], i) => {
        return factory.create('vote', {
          playerId: state.eligiblePlayers[i].id,
          cycleId: state.cycle.id,
          goals: [
            {url: `${state.chapter.goalRepositoryURL}/issues/${goal1}`},
            {url: `${state.chapter.goalRepositoryURL}/issues/${goal2}`},
          ],
        })
      })
    )
  }

  async when() {
    const {cycle} = this.state

    return await runGraphQLQuery(
      `{
        getCycleVotingResults(
          cycleId: "${cycle.id}"
        )
        { id,
          cycle {id},
          numEligiblePlayers,
          numVotes,
          candidateGoals {
            goal {url},
            playerGoalRanks { playerId, goalRank }
          }
        }
      }`,
      fields,
      {currentUser: {roles: ['player']}},
    )
  }

  async expect(t) {
    const state = this.state
    const response = this.result.data.getCycleVotingResults

    t.is(response.numEligiblePlayers, state.eligiblePlayers.length)
    t.is(response.numVotes, 3)
    t.is(response.cycle.id, state.cycle.id)
    t.true(response.candidateGoals[0].goal.url.endsWith(`/${state.firstPlaceGoalNumber}`))
    t.true(response.candidateGoals[1].goal.url.endsWith(`/${state.secondPlaceGoalNumber}`))
    t.true(response.candidateGoals[2].goal.url.endsWith(`/${state.thirdPlaceGoalNumber}`))
    t.is(response.candidateGoals[0].playerGoalRanks.length, 3)
    t.is(response.candidateGoals[1].playerGoalRanks.length, 2)
    t.is(response.candidateGoals[2].playerGoalRanks.length, 1)
  }
}

GetCycleVotingResultsSpec.run({r})

