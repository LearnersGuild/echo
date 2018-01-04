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
          phase {
            id
            number
            name
          }
          createdAt
          updatedAt
          roles
        }
      }
    `,
  }
}
