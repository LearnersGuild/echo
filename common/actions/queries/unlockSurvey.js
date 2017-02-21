export default function unlockSurvey({playerId, projectId}) {
  return {
    variables: {playerId, projectId},
    query: `
      mutation($playerId: ID!, $projectId: ID!) {
        unlockRetroSurveyForUser(playerId: $playerId, projectId: $projectId) {
          success
        }
      }
    `,
  }
}
