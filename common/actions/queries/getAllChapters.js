export default function findChapters() {
  return {
    variables: {},
    query: `
      query {
        getAllChapters {
          id
          name
          channelName
          timezone
          goalRepositoryURL
          cycleDuration
          cycleEpoch
          inviteCodes
        }
      }
    `,
  }
}
