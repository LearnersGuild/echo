import {FEEDBACK_TYPE_DESCRIPTORS} from 'src/common/models/feedbackType'

export default function Member(identifier) {
  return {
    variables: {identifier},
    query: `query ($identifier: String!) {
      Member(identifier: $identifier) {
        member {
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
          }
          createdAt
          updatedAt
          chapter {
            id
            name
          }
        }
        memberProjectSummaries {
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
          memberProjectEvaluations {
            ${FEEDBACK_TYPE_DESCRIPTORS.GENERAL_FEEDBACK}
          }
        }
      }
    }`,
  }
}
