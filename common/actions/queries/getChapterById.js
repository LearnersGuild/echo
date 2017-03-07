export default function getChapterById(id) {
  return {
    variables: {id},
    query: `
      query ($id: ID!) {
        getChapterById(id: $id) {
          id
          name
          channelName
          timezone
          goalRepositoryURL
          inviteCodes
        }
      }
    `,
  }
}
