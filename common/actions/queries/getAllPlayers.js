export default function getAllPlayers() {
  return {
    variables: {},
    query: `
      query {
        getAllPlayers {
          id
          chapter {
            id
            name
            channelName
            timezone
            cycleDuration
            cycleEpoch
            inviteCodes
          }
          createdAt
          updatedAt
        }
      }
    `,
  }
}
