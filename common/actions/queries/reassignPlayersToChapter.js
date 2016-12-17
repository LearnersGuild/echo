export default function reassignPlayersToChapter(playerIds, chapterId) {
  return {
    variables: {playerIds, chapterId},
    query: `
      mutation ($playerIds: [ID], $chapterId: ID!) {
        reassignPlayersToChapter(playerIds: $playerIds, chapterId: $chapterId) {
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
        }
      }
    `,
  }
}
