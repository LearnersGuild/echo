import test from 'ava'

import fields from '../mutation'
import r from '../../../../../db/connect'
import factory from '../../../../../test/factories'
import {runGraphQLQuery} from '../../../../../test/graphql-helpers'

test.serial('reassignPlayersToChapter updates players', async t => {
  t.plan(3)

  const chapter = await factory.create('chapter')
  const players = await factory.createMany('player', 2)
  const playerIds = players.map(p => p.id)

  const results = await runGraphQLQuery(
    `
      query($playerIds: [ID]!, $chapterId: ID!) {
        reassignPlayersToChapter(playerIds: $playerIds, chapterId: $chapterId) { id }
      }
    `,
    fields,
    {playerIds: players.map(p => p.id), chapterId: chapter.id},
    {currentUser: {roles: ['backoffice']}},
  )

  t.deepEqual(
    results.data.reassignPlayersToChapter.map(p => p.id).sort(),
    playerIds.sort(),
  )

  const updatedPlayers = await r.table('players').getAll(...playerIds).run()
  updatedPlayers.forEach(p => {
    t.is(p.chapterId, chapter.id)
  })
})

test.todo('reassignPlayersToChapter - unauthorized users recieve an appropriate error')
test.todo('reassignPlayersToChapter - invalid queries recieve an appropriate error')
