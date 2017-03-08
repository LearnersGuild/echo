export default function deleteProject(projectId) {
  return {
    variables: {projectId},
    query: `
      mutation($projectId: ID!) {
        deleteProject(projectId: $projectId) {
          id
          name
          cycleId
        }
      }
    `
  }
}
