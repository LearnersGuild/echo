export default function findProjects({page, identifiers} = {}) {
  return {
    variables: {page, identifiers},
    query: `
      query ($identifiers: [String]) {
        findProjects(identifiers: $identifiers) {
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
          }
        }
      }
    `,
  }
}
