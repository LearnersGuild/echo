export default function findUsers(ids) {
  return {
    variables: {ids},
    query: `
      query ($ids: [ID]!) {
        getUsersByIds(ids: $ids) {
          id
          email
          name
          handle
          avatarUrl
          dateOfBirth
          timezone
        }
      }
    `,
  }
}
