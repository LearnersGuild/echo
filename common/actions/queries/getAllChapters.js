export default function findChapters() {
  return {
    variables: {},
    query: `
      query {
        getAllChapters {
          id
          name
          channelName
          goalRepositoryURL
          inviteCodes
          activeProjectCount
          activePlayerCount
          latestCycle {
            id
            cycleNumber
            state
          }
        }
      }
    `,
  }
}
