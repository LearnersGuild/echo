export default function lockSurveyForMember(surveyId, memberId) {
  return {
    variables: {surveyId, memberId},
    query: `
      mutation($surveyId: ID!, $memberId: ID!) {
        lockSurveyForMember(surveyId: $surveyId, memberId: $memberId) {
          id
          completedBy
          unlockedFor
        }
      }
    `,
  }
}
