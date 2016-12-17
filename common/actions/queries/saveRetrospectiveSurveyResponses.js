export default function saveRetrospectiveSurveyResponse(responses) {
  return {
    variables: {responses},
    query: `
      mutation($responses:[SurveyResponseInput]!) {
        saveRetrospectiveSurveyResponses(responses:$responses) {
          createdIds
        }
      }
    `,
  }
}
