import test from 'ava'

import fields from '../mutation'
import r from '../../../../../db/connect'
import factory from '../../../../../test/factories'
import {runGraphQLQuery} from '../../../../../test/graphql-helpers'

async function testVoteForGoals(t, args = {}, cb) {
  const chapter = await factory.create('chapter')
  const cycle = await factory.create('cycle', {chapterId: chapter.id, state: 'GOAL_SELECTION'})
  const player = await factory.create('player', {chapterId: chapter.id})

  const initialVote = args.withExistingVote && await factory.create('vote', {playerId: player.id, cycleId: cycle.id})

  const voteGoals = [
    {url: `${chapter.goalRepositoryURL}/issues/1`},
    {url: `${chapter.goalRepositoryURL}/issues/2`},
  ]

  const results = await runGraphQLQuery(
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
  const votes = await r.table('votes').run()
  const vote = votes[0]

  t.is(vote.cycleId, cycle.id)
  t.is(vote.playerId, player.id)
  t.deepEqual(vote.goals, voteGoals)

  t.deepEqual(results.data.voteForGoals.id, vote.id)

  if (cb) {
    cb(vote, initialVote)
  }
}

test.serial('voteForGoals first vote creates a vote', t => {
  testVoteForGoals(t)
})

test.serial('voteForGoals when vote exists updates vote', t => {
  testVoteForGoals(t, {withExistingVote: true}, (vote, initialVote) => {
    t.is(vote.id, initialVote.id)
    t.not(vote.updatedAt.getTime(), initialVote.updatedAt.getTime())
  })
})
