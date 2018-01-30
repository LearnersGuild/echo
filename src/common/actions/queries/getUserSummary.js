import {FEEDBACK_TYPE_DESCRIPTORS} from 'src/common/models/feedbackType'

export default function getUserSummary(identifier) {
  return {
    variables: {identifier},
    query: `query ($identifier: String!) {
      getUserSummary(identifier: $identifier) {
        user {
          id
          phone
          email
          name
          handle
          avatarUrl
          profileUrl
          timezone
          active
          phase {
            id
            number
            name
          }
          createdAt
          updatedAt
          chapter {
            id
            name
          }
        }
        userProjectSummaries {
          project {
            id
            name
            phaseId
            artifactURL
            cycle {
              state
              cycleNumber
              startTimestamp
              endTimestamp
            }
            goal {
              title
              number
              phase
            }
          }
          userProjectEvaluations {
            ${FEEDBACK_TYPE_DESCRIPTORS.GENERAL_FEEDBACK}
          }
        }
      }
    }`,
  }
}
