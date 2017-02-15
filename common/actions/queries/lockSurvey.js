export default function lockSurvey(projectAndPlayerIds) {
  return {
    variables: {projectAndPlayerIds},
    query: `
      mutation($playerId: ID!, $projectId: ID!) {
        lockRetroSurveyForUser(playerId: $playerId, projectId: $projectId) {
          success
        }
      }
    `,
  }
}
