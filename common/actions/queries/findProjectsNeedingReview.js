export default function findProjectsNeedingReview(coachId) {
  return {
    variables: {coachId},
    query: `
      query ($coachId: ID!){
        findProjectsToReview (coachId: $coachId) {
          project {
            chapterId
            createdAt
            cycleId
            expectedHours
            goal {
              number
              title
              url
            }
            id
            name
            playerIds
            state
            updatedAt
          }
        }
      }
    `,
  }
}
