import {STAT_DESCRIPTORS} from 'src/common/models/stat'

export default function findProjectsToReview(playerId) {
  return {
    variables: {playerId},
    query: `
      query ($playerId: ID!){
        findProjectsToReview (playerId: $playerId) {
          id
          name
          playerIds
          createdAt
          coachId
          cycle {
            cycleNumber
          }
          goal {
            title
            number
          }
          stats {
            ${STAT_DESCRIPTORS.PROJECT_COMPLETENESS}
            ${STAT_DESCRIPTORS.PROJECT_HOURS}
          }
        }
      }
    `,
  }
}
