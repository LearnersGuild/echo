export default function findPhaseSummaries() {
  return {
    variables: {},
    query: `
      query {
        findPhaseSummaries {
          phase {
            id
            number
            name
          }
          currentProjects {
            id
            name
            memberIds
            phaseId
            artifactURL
            retrospectiveSurveyId
            createdAt
            updatedAt
            goal {
              title
              url
            }
          }
          currentMembers {
            id
            chapterId
            name
            handle
          }
        }
      }
    `,
  }
}
