import FEEDBACK_TYPE_DESCRIPTORS from 'src/common/models/feedbackType'

export default function unlockSurvey(memberId, projectId) {
  return {
    variables: {memberId, projectId},
    query: `
      mutation($memberId: ID!, $projectId: ID!) {
        unlockRetroSurveyForUser(memberId: $memberId, projectId: $projectId) {
          project {
            id
            name
            artifactURL
            retrospectiveSurveyId
            createdAt
            updatedAt
            goal {
              number
              title
              phase
            }
            chapter {
              id
              name
            }
            cycle {
              id
              cycleNumber
              state
              startTimestamp
              endTimestamp
            }
          }
          projectUserSummaries {
            user {
              id
              name
              handle
              avatarUrl
            }
            userProjectEvaluations {
              ${FEEDBACK_TYPE_DESCRIPTORS.GENERAL_FEEDBACK}
            }
            userRetrospectiveComplete
            userRetrospectiveUnlocked
          }
        }
      }
    `,
  }
}
