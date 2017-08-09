import {FEEDBACK_TYPE_DESCRIPTORS} from 'src/common/models/feedbackType'

import {repeat, flatten, sum} from '../util'
import {getMemberIds, getMemberFeedback} from '../pool'

export const FEEDBACK_TYPE_WEIGHTS = {
  [FEEDBACK_TYPE_DESCRIPTORS.TEAM_PLAY]: 1,
  [FEEDBACK_TYPE_DESCRIPTORS.TECHNICAL_COMPREHENSION]: 0.25
}

export const NOVELTY_WEIGHT = 1
export const PERFECT_SCORE = sum([...Object.values(FEEDBACK_TYPE_WEIGHTS), NOVELTY_WEIGHT])

export default class MembersGetTeammatesTheyGaveGoodFeedbackAppraiser {
  constructor(pool) {
    this.pool = pool
    this.feedbackCache = {}
  }

  score(teamFormationPlan) {
    const scoresForUnassignedMembers = this.getScoresForUnassignedMembers(teamFormationPlan)
    const scoresForAssignedMembers = this.getScoresForAssignedMembers(teamFormationPlan)

    const scores = scoresForAssignedMembers.concat(scoresForUnassignedMembers)
    return sum(scores) / scores.length
  }

  getScoresForUnassignedMembers(teamFormationPlan) {
    const unassignedMemberIds = new Set(getMemberIds(this.pool))
    teamFormationPlan.teams.forEach(team =>
      team.memberIds.forEach(subjectId => {
        unassignedMemberIds.delete(subjectId)
      })
    )
    return repeat(unassignedMemberIds.size, 1)
  }

  getScoresForAssignedMembers(teamFormationPlan) {
    const scoresForAssignedMembers = teamFormationPlan.teams.map(team =>
      team.memberIds.map(subjectId => {
        const teammates = team.memberIds.filter(p => p !== subjectId)

        if (teammates.length === 0) {
          return 1
        }

        return teammates.map(respondentId => {
          return this.getScoreForPairing({respondentId, subjectId})
        })
      })
    )
    return flatten(scoresForAssignedMembers)
  }

  getScoreForPairing({respondentId, subjectId}) {
    const feedback = this.getFeedback({respondentId, subjectId})

    if (!feedback) {
      return 1
    }

    const weightedScores = Object.entries(feedback).map(([feedbackType, value]) => FEEDBACK_TYPE_WEIGHTS[feedbackType] * (value / 100))
    const rawScore = sum(weightedScores)

    return rawScore / PERFECT_SCORE
  }

  getFeedback({respondentId, subjectId}) {
    return getMemberFeedback(this.pool, {respondentId, subjectId})
  }
}
