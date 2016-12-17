export default function createOrUpdateChapter(chapter) {
  return {
    variables: {chapter},
    query: `
      mutation ($chapter: InputChapter!) {
        createOrUpdateChapter(chapter: $chapter) {
          id
          name
          channelName
          timezone
          cycleDuration
          cycleEpoch
          inviteCodes
        }
      }
    `,
  }
}
