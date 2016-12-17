import {findPlayersForChapter} from 'src/server/db/player'
import {mapById} from 'src/server/util'
import getPlayerInfo from './getPlayerInfo'

export default async function findActivePlayersInChapter(chapterId) {
  const players = await findPlayersForChapter(chapterId)
  const playerIds = players.map(_ => _.id)
  const idmActiveUsers = (await getPlayerInfo(playerIds)).filter(_ => _.active)
  const idmActiveUserMap = mapById(idmActiveUsers)
  return players.filter(player => Boolean(idmActiveUserMap.get(player.id)))
}
