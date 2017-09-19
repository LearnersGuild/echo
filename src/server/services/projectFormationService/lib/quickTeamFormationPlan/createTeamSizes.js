import NoValidPlanFoundError from '../errors'
import {getMinTeamSize} from '../pool'

export default function createTeamSizes(recTeamSize, numMembers) {
  const numPerfectTeams = Math.floor(numMembers / recTeamSize)

  // form as many perfect teams as possible
  const teamSizes = new Array(numPerfectTeams).fill(null)
    .map(() => recTeamSize)

  // any members "left over"?
  const remainingMembers = (numMembers % recTeamSize) || 0

  if (remainingMembers) {
    const minTeamSize = getMinTeamSize(recTeamSize)
    const maxTeamSize = recTeamSize + 1

    if (remainingMembers >= minTeamSize && remainingMembers <= maxTeamSize) {
      teamSizes.push(remainingMembers)
    } else if (remainingMembers <= teamSizes.length) {
      // teams can be rec size + 1, and there are few enough remaining spots that
      // we can add each of them to an existing (previously "perfect-sized") team
      for (let i = 0; i < remainingMembers; i++) {
        teamSizes[i]++
      }
    } else if (teamSizes.length > 0 && (remainingMembers + teamSizes.length) <= minTeamSize) {
      // teams can be rec size - 1, and there are enough "perfect-sized" teams
      // that we can take 1 spot from the members of some them and
      // add those to the leftover spots to make 1 more team
      let remainingTeamSize = remainingMembers
      for (let i = 0; remainingTeamSize < minTeamSize; i++) {
        teamSizes[i]--
        remainingTeamSize++
      }
      teamSizes.push(remainingTeamSize)
    } else {
      throw new NoValidPlanFoundError('Could not find valid team sizes')
    }
  }

  return teamSizes
}
