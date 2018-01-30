export default function getCycleVotingResults() {
  return {
    query: `
      query {
        getCycleVotingResults {
          id
          cycle {
            id
            cycleNumber
            startTimestamp
            state
            chapter {
              id
              name
              channelName
              timezone
              githubTeamId
            }
          }
          pools {
            id
            name
            voterMemberIds
            users {
              id
            }
            phase {
              id
              number
              name
            }
            votingIsStillOpen
            candidateGoals {
              goal {
                number
                url
                title
              }
              memberGoalRanks {
                memberId
                goalRank
              }
            }
          }
        }
      }
    `,
  }
}
