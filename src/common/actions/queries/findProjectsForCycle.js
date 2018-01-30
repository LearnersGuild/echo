export default function findProjectsForCycle({cycleNumber} = {}) {
  return {
    variables: {cycleNumber},
    query: `
      query ($cycleNumber: Int) {
        findProjectsForCycle(cycleNumber: $cycleNumber) {
          id
          name
          memberIds
          phaseId
          artifactURL
          retrospectiveSurveyId
          createdAt
          updatedAt
          cycle {
            id
            cycleNumber
            state
            weekStartedAt
          }
        }
      }
    `,
  }
}
