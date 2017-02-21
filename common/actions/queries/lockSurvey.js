export default function lockSurvey({playerId, projectId}) {
  return {
    variables: {playerId, projectId},
    query: `
      mutation($playerId: ID!, $projectId: ID!) {
        lockRetroSurveyForUser(playerId: $playerId, projectId: $projectId) {
          success
        }
      }
    `,
  }
}
