export default function deleteProject(identifier) {
  return {
    variables: {identifier},
    query: `
      mutation($identifier: String!) {
        deleteProject(identifier: $identifier) {
          success
        }
      }
    `
  }
}
