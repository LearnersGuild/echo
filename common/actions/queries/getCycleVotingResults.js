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
              goalRepositoryURL
              githubTeamId
              cycleDuration
              cycleEpoch
            }
          }
          pools {
            id
            name
            voterPlayerIds
            users {
              id
            }
            votingIsStillOpen
            candidateGoals {
              goal {
                url
                title
              }
              playerGoalRanks {
                playerId
                goalRank
              }
            }
          }
        }
      }
    `,
  }
}
