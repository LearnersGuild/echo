import test from 'ava'

import fields from '../mutation'
import r from '../../../../../db/connect'
import factory from '../../../../../test/factories'
import Spec from '../../../../../test/helpers/Spec'
import {runGraphQLQuery} from '../../../../../test/graphql-helpers'

class VoteForGoalsSpec extends Spec {

  async given(t) {
    const state = this.state

    state.chapter = await factory.create('chapter')
    state.cycle = await factory.create('cycle', {chapterId: state.chapter.id, state: 'GOAL_SELECTION'})
    state.player = await factory.create('player', {chapterId: state.chapter.id})

    state.voteGoals = [
      {url: `${state.chapter.goalRepositoryURL}/issues/1`},
      {url: `${state.chapter.goalRepositoryURL}/issues/2`},
    ]
  }

  async when(t) {
    const {voteGoals, player} = this.state

    return await runGraphQLQuery(
      `{
        voteForGoals(
          goals: ["${voteGoals[0].url}", "${voteGoals[1].url}"],
          playerId: "${player.id}"
        )
        { id }
      }`,
      fields,
      {currentUser: {roles: ['player']}},
    )
  }

  async expect(t) {
    const state = this.state

    state.votes = await state.r.table('votes').run()
    state.vote = state.votes[0]

    t.is(state.vote.cycleId, state.cycle.id)
    t.is(state.vote.playerId, state.player.id)
    t.deepEqual(state.vote.goals, state.voteGoals)

    t.deepEqual(this.result.data.voteForGoals.id, state.vote.id)
  }
}

VoteForGoalsSpec.run({r})

class VoteForGoalsWhenVoteExistsSpec extends VoteForGoalsSpec {
  async given(t) {
    await super.given(t)
    this.state.initialVote = await factory.create('vote', {
      playerId: this.state.player.id,
      cycleId: this.state.cycle.id
    })
  }

  async expect(t) {
    await super.expect(t)
    t.is(this.state.vote.id, this.state.initialVote.id)
    t.not(
      this.state.vote.updatedAt.getTime(),
      this.state.initialVote.updatedAt.getTime()
    )
  }
}

VoteForGoalsWhenVoteExistsSpec.run({r})
