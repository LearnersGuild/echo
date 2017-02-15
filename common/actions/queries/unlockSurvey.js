export default function unlockSurvey(projectAndPlayerIds) {
  return {
    variables: {projectAndPlayerIds},
    query: `
      mutation($playerId: ID!, $projectId: ID!) {
        unlockRetroSurveyForUser(playerId: $playerId, projectId: $projectId) {
          success
        }
      }
    `,
  }
}
