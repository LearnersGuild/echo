export default function findChapters() {
  return {
    variables: {},
    query: `
      query {
        getAllChapters {
          id
          name
          channelName
          cycleEpoch
          cycleDuration
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
