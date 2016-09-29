import {
  getPlayerIds,
  getVotesByPlayerId,
  getPlayerIdsByVote,
} from '../pool'

export default class PlayersGotTheirVoteAppraiser {
  constructor(pool, playerIds) {
    this.pool = pool
    this.votesByPlayerId = getVotesByPlayerId(pool)
    this.playerIdsByVote = getPlayerIdsByVote(pool)
    this.playerIds = new Set(playerIds || getPlayerIds(pool))
  }

  score(teamFormationPlan) {
    const {playerIds} = this
    const playerCount = playerIds.size

    const unassignedPlayerIds = new Set(playerIds)
    const playersConsidered = new Set()
    const playerIdFilter = playerId => playerIds.has(playerId) && !playersConsidered.has(playerId)

    const rawScoreForAssignedPlayers = teamFormationPlan.teams.reduce((sum, team) => {
      const matchingPlayerIds = team.playerIds.filter(playerIdFilter)
      matchingPlayerIds.forEach(id => {
        playersConsidered.add(id)
        unassignedPlayerIds.delete(id)
      })
      const [firstChoice, secondChoice] = this.countPlayersWhoGotTheirVote(matchingPlayerIds, team.goalDescriptor)
      return sum +
        firstChoice +
        (secondChoice * PlayersGotTheirVoteAppraiser.SECOND_CHOICE_VALUE)
    }, 0)

    const rawScoreForUnassignedPlayers = this.bestPossibleRawScoreForUnassignedPlayers(teamFormationPlan, unassignedPlayerIds)
    const score = (rawScoreForAssignedPlayers + rawScoreForUnassignedPlayers) / playerCount

    // Make sure floating piont math never gives us more than 1.0
    return Math.min(1, score)
  }

  bestPossibleRawScoreForUnassignedPlayers(teamFormationPlan, unassignedPlayerIds) {
    const voteCounts = this.voteCountsByGoal(unassignedPlayerIds)

    let sum = 0
    let totalEmptySeats = 0
    for (const [goalDescriptor, emptySeats] of this.emptySeatsByGoal(teamFormationPlan)) {
      totalEmptySeats += emptySeats
      const [firstVotesForGoal, secondVotesForGoal] = voteCounts.get(goalDescriptor)
      const potentialFirstChoiceAssignments = Math.min(emptySeats, firstVotesForGoal)
      const potentialSecondChoiceAssignments = Math.min(emptySeats - potentialFirstChoiceAssignments, secondVotesForGoal)
      sum += potentialFirstChoiceAssignments + (potentialSecondChoiceAssignments * PlayersGotTheirVoteAppraiser.SECOND_CHOICE_VALUE)
    }
    const playersWhoCouldGetTheirVoteOnUnformedTeams = Math.max(0, unassignedPlayerIds.size - totalEmptySeats)

    sum += playersWhoCouldGetTheirVoteOnUnformedTeams
    return Math.min(sum, unassignedPlayerIds.size)
  }

  countPlayersWhoGotTheirVote(playerIds, goalDescriptor) {
    const result = [0, 0]
    playerIds.forEach(playerId => {
      const votes = this.votesByPlayerId[playerId]
      result[0] += Number(votes[0] === goalDescriptor)
      result[1] += Number(votes[1] === goalDescriptor)
    })
    return result
  }

  emptySeatsByGoal(teamFormationPlan) {
    const result = new Map()
    teamFormationPlan.teams.forEach(team => {
      const emptySeats = team.teamSize - team.playerIds.length
      const currentCount = result.get(team.goalDescriptor) || 0
      result.set(team.goalDescriptor, currentCount + emptySeats)
    })
    return result
  }

  voteCountsByGoal(playerIds) {
    const result = new Map(this.pool.goals.map(({goalDescriptor}) => [goalDescriptor, [0, 0]]))
    for (const {playerId, votes} of this.pool.votes) {
      if (playerIds.has(playerId)) {
        votes.forEach((goalDescriptor, i) => {
          result.get(goalDescriptor)[i]++
        })
      }
    }
    return result
  }

}

PlayersGotTheirVoteAppraiser.SECOND_CHOICE_VALUE = 0.7
