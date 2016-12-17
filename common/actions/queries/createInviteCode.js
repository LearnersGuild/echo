export default function createInviteCode(inviteCode) {
  return {
    variables: {inviteCode},
    query: `
      mutation ($inviteCode: InputInviteCode!) {
        createInviteCode(inviteCode: $inviteCode) {
          id
          code
        }
      }
  `,
  }
}
