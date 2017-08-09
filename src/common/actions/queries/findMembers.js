export default function findMembers(identifiers) {
  return {
    variables: {identifiers},
    query: `
      query ($identifiers: [String]) {
        findMembers(identifiers: $identifiers) {
          id
          chapterId
          chapter {
            id
            name
            channelName
            timezone
            inviteCodes
          }
          phone
          email
          name
          handle
          avatarUrl
          profileUrl
          timezone
          active
          phaseId
          phase {
            id
            number
          }
          createdAt
          updatedAt
        }
      }
    `,
  }
}
