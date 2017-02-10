import {STAT_DESCRIPTORS} from 'src/common/models/stat'

export default function getProjectSummary(identifier) {
  return {
    variables: {identifier},
    query: `query ($identifier: String!) {
      getProjectSummary(identifier: $identifier) {
        project {
          id
          name
          artifactURL
          createdAt
          updatedAt
          goal {
            number
            title
            level
          }
          stats {
            ${STAT_DESCRIPTORS.PROJECT_COMPLETENESS}
            ${STAT_DESCRIPTORS.PROJECT_HOURS}
            ${STAT_DESCRIPTORS.PROJECT_QUALITY}
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
        projectEvaluations {
          createdAt
          submittedBy {
            id
            handle
            name
          }
          ${STAT_DESCRIPTORS.PROJECT_COMPLETENESS}
          ${STAT_DESCRIPTORS.PROJECT_QUALITY}
        }
        projectUserSummaries {
          user {
            id
            name
            handle
            avatarUrl
          }
          userProjectEvaluations {
            ${STAT_DESCRIPTORS.GENERAL_FEEDBACK}
          }
          userProjectStats {
            ${STAT_DESCRIPTORS.CHALLENGE}
            ${STAT_DESCRIPTORS.CULTURE_CONTRIBUTION}
            ${STAT_DESCRIPTORS.ELO}
            ${STAT_DESCRIPTORS.ESTIMATION_ACCURACY}
            ${STAT_DESCRIPTORS.ESTIMATION_BIAS}
            ${STAT_DESCRIPTORS.EXPERIENCE_POINTS}
            ${STAT_DESCRIPTORS.LEVEL} {
              starting
              ending
            }
            ${STAT_DESCRIPTORS.PROJECT_HOURS}
            ${STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION}
            ${STAT_DESCRIPTORS.TEAM_PLAY_FLEXIBLE_LEADERSHIP}
            ${STAT_DESCRIPTORS.TEAM_PLAY_FRICTION_REDUCTION}
            ${STAT_DESCRIPTORS.TEAM_PLAY_RECEPTIVENESS}
            ${STAT_DESCRIPTORS.TEAM_PLAY_RESULTS_FOCUS}
            ${STAT_DESCRIPTORS.TEAM_PLAY}
            ${STAT_DESCRIPTORS.TECHNICAL_HEALTH}
          }
        }
      }
    }`,
  }
}
