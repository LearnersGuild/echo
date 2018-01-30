export default function getProject(identifier) {
  return {
    variables: {identifier},
    query: `
      query ($identifier: String!) {
        getProject(identifier: $identifier) {
          id
          name
          artifactURL
          retrospectiveSurveyId
          chapterId
          chapter {
            id
            name
          }
          cycleId
          cycle {
            id
            cycleNumber
          }
          phaseId
          phase {
            id
            number
            name
          }
          goal {
            url
            number
          }
          members {
            id
            handle
          }
          createdAt
          updatedAt
        }
      }
    `,
  }
}
