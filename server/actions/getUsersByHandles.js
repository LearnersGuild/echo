import config from 'src/config'
import graphQLFetcher from 'src/server/util/graphql'

export default function getUsersByHandles(userHandles) {
  return graphQLFetcher(config.server.idm.baseURL)({
    query: 'query ($handles: [String]!) { getUsersByHandles(handles: $handles) { id handle name email roles } }',
    variables: {handles: userHandles},
  }).then(result => result.data.getUsersByHandles)
}

// import {findProjects} from 'src/server/db/project'
// import findUsers from 'src/server/actions/findUsers'
//
// // const handles = project.playerIds.map(playerId => allUsersById.get(playerId).handle)
//
// export function getUsersByProject(project, user) {
//   const projects = await findProjects({chapterId: cycle.chapterId, cycleId: cycle.id})
//
//   // get all user info from IDM in one fell swoop
//   const allPlayerIds = projects.reduce((result, project) => {
//     result = result.concat(project.playerIds)
//     return result
//   }, [])
//   const allUsersById = mapById(
//     await findUsers(allPlayerIds)
//   )
}
