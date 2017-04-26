export default function findRetrospectiveSurveys(filters) {
  return {
    variables: filters,
    query: `
      query {
        findRetrospectiveSurveys {
          id,
          project {
            id,
            name,
            artifactURL,
            chapter {
              id,
              name,
            },
            cycle {
              id,
              cycleNumber,
            },
          },
          questions {
            id,
            body,
            responseType,
            responseInstructions,
            subjectType,
            subjects {
              id,
              name,
              handle,
              profileUrl,
              avatarUrl,
            },
            response {
              values {
                subjectId,
                value,
              }
            },
          },
        },
      }
    `,
  }
}
