import {range, flatten, repeat} from './index'

export function buildTestPool(opts) {
  const {
    playerCount,
    advancedPlayerCount,
    goalCount,
    teamSize,
    advancedPlayerMaxTeams,
    voteDistributionPercentages,
  } = {
    teamSize: 4,
    advancedPlayerMaxTeams: [3],
    voteDistributionPercentages: [0.2, 0.2, 0.1],
    ...opts,
  }

  const goals = range(0, goalCount).map(i => ({
    goalDescriptor: `g${i}`,
    teamSize,
  }))
  const voteDistribution = buildVoteDistribution(playerCount + advancedPlayerCount, goals, voteDistributionPercentages)
  const advancedPlayers = range(0, advancedPlayerCount).map(i => ({id: `A${i}`, maxTeams: advancedPlayerMaxTeams[i % advancedPlayerMaxTeams.length]}))
  const nonAdvancedPlayers = range(0, playerCount).map(i => ({id: `p${i}`}))
  const players = nonAdvancedPlayers.concat(advancedPlayers)

  const votes = players.map((playerInfo, i) => ({
    playerId: playerInfo.id,
    votes: voteDistribution[i],
  }))

  return {votes, goals, advancedPlayers}
}

function buildVoteDistribution(voteCount, goals, percentages) {
  const distinctGoalCount = goals.length
  const goalDescriptors = goals.map(_ => _.goalDescriptor)
  const voteDistribution = goalDescriptors.reduce((result, goalDescriptor, i) => {
    const percentOfVotes = percentages[i] || 0
    const goalProbability = Math.floor(voteCount * percentOfVotes)

    return result.concat(
      repeat(
        Math.max(1, goalProbability),
        [goalDescriptor, goalDescriptors[(i + 1) % distinctGoalCount]]
      )
    )
  }, [])

  const votesLeft = voteCount - voteDistribution.length
  const fillerVotes = flatten(repeat(Math.ceil(votesLeft / distinctGoalCount), goalDescriptors))
    .map((goalDescriptor, i) => [goalDescriptor, goalDescriptors[(i + 1) % distinctGoalCount]])

  return voteDistribution.concat(fillerVotes.reverse().slice(0, votesLeft))
}
