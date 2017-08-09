export default function deactivateMember(memberId) {
  return {
    variables: {memberId},
    query: `
      mutation ($memberId: ID!) {
        deactivateMember(identifier: $memberId) {
          id
          active
          handle
        }
      }
  `,
  }
}
