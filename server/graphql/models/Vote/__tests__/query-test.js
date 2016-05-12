import fields from '../query'
import factory from '../../../../../test/factories'
import Spec from '../../../../../test/helpers/Spec'
import {runGraphQLQuery} from '../../../../../test/graphql-helpers'

class GetCycleVotingResultsSpec extends Spec {

  async given() {
    const self = this
    const state = this.state

    state.chapter = await factory.create('chapter')
    state.cycle = await factory.create('cycle', {chapterId: state.chapter.id})
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
            {url: self.goalURLFor(goal1)},
            {url: self.goalURLFor(goal2)},
          ],
        })
      })
    )
  }

  goalURLFor(goalId) {
    return `${this.state.chapter.goalRepositoryURL}/issues/${goalId}`
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

GetCycleVotingResultsSpec.run()

class GetCycleVotingResultsWithIneligableVotersSpec extends GetCycleVotingResultsSpec {
  async given(t) {
    await super.given(t)
    const chapter = await factory.create('chapter')
    const cycle = await factory.create('cycle', {chapterId: chapter.id})
    const player = await factory.create('player', {chapterId: chapter.id})

    factory.create('vote', {
      playerId: player.id,
      cycleId: cycle.id,
      goals: [
        {url: this.goalURLFor(this.state.thirdPlaceGoalNumber)},
        {url: this.goalURLFor(this.state.secondPlaceGoalNumber)},
      ],
    })
  }
}

GetCycleVotingResultsWithIneligableVotersSpec.run()

