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
          createdAt
          updatedAt
          chapter {
            id
            name
          }
          stats {
            rating
            xp
          }
        }
        userProjectSummaries {
          project {
            id
            name
            cycle {
              state
              startTimestamp
              endTimestamp
            }
            goal {
              title
            }
            stats {
              hours
            }
          }
          userProjectReviews {
            general
          }
          userProjectStats {
            rating
            xp
            culture
            technical
            hours
            teamPlay
            receptiveness
            focus
            leadership
            friction
            contribution {
              estimated
            }
          }
        }
      }
    }`,
  }
}
