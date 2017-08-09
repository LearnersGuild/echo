export default function unlockSurveyForMember(surveyId, memberId) {
  return {
    variables: {surveyId, memberId},
    query: `
      mutation($surveyId: ID!, $memberId: ID!) {
        unlockSurveyForMember(surveyId: $surveyId, memberId: $memberId) {
          id
          completedBy
          unlockedFor
        }
      }
    `,
  }
}
