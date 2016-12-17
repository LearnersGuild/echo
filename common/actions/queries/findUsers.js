export default function findUsers(identifiers) {
  return {
    variables: {identifiers},
    query: `
      query ($identifiers: [String]) {
        findUsers(identifiers: $identifiers) {
          id
          chapterId
          phone
          email
          name
          handle
          avatarUrl
          profileUrl
          timezone
          active
          createdAt
          updatedAt
          stats {
            rating
            xp
          }
        }
      }
    `,
  }
}
