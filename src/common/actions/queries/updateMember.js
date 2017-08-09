export default function updateMember(values) {
  return {
    variables: {values},
    query: `
      mutation ($values: InputMember!) {
        updateMember(values: $values) {
          id
          handle
          updatedAt
        }
      }
    `,
  }
}
