/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks, no-multi-spaces, comma-spacing  */
import {FEEDBACK_TYPE_DESCRIPTORS} from 'src/common/models/feedbackType'

import MembersGetTeammatesTheyGaveGoodFeedbackAppraiser, {
  NOVELTY_WEIGHT,
  PERFECT_SCORE,
} from '../MembersGetTeammatesTheyGaveGoodFeedbackAppraiser'

const {TEAM_PLAY, TECHNICAL_COMPREHENSION} = FEEDBACK_TYPE_DESCRIPTORS

describe(testContext(__filename), function () {
  const bestScoreForRepeatTeammate = (PERFECT_SCORE - NOVELTY_WEIGHT) / PERFECT_SCORE
  const poolDefaults = {
    votes: [
      {memberId: 'p0', votes: ['g1', 'g2']},
      {memberId: 'p1', votes: ['g1', 'g2']},
      {memberId: 'p2', votes: ['g1', 'g2']},
      {memberId: 'p3', votes: ['g1', 'g2']},
    ],
    goals: [
      {goalDescriptor: 'g1', teamSize: 3},
      {goalDescriptor: 'g2', teamSize: 4},
    ],
  }

  context('when the teams are complete', function () {
    const teamFormationPlan = {
      teams: [
        {goalDescriptor: 'g1', memberIds: ['p0', 'p1']},
        {goalDescriptor: 'g3', memberIds: ['p2', 'p3']},
      ]
    };

    ([0, 50, 100]).forEach(v => {
      it(`returns ${v} when everyone rated all their teammates ${v}`, function () {
        const feedback = {[TEAM_PLAY]: v, [TECHNICAL_COMPREHENSION]: v}
        const memberFeedback = {
          respondentIds: {
            p0: {subjectIds: {p1: feedback, p2: feedback, p3: feedback}},
            p1: {subjectIds: {p0: feedback, p2: feedback, p3: feedback}},
            p2: {subjectIds: {p0: feedback, p1: feedback, p3: feedback}},
            p3: {subjectIds: {p0: feedback, p1: feedback, p2: feedback}},
          }
        }
        const pool = {...poolDefaults, memberFeedback}

        const appraiser = new MembersGetTeammatesTheyGaveGoodFeedbackAppraiser(pool)
        const score = appraiser.score(teamFormationPlan)

        expect(score).to.eq((v / 100) * bestScoreForRepeatTeammate)
      })
    })

    it('weights each member correctly', function () {
      const perfectScore = {[TEAM_PLAY]: 100, [TECHNICAL_COMPREHENSION]: 100}
      const halfScore = {[TEAM_PLAY]: 50, [TECHNICAL_COMPREHENSION]: 50}
      const memberFeedback = {
        respondentIds: {
          p0: {
            subjectIds: {
              p1: halfScore,
              p2: perfectScore,
              p3: perfectScore,
            },
          },
          p1: {subjectIds: {p0: perfectScore, p2: perfectScore, p3: perfectScore}},
          p2: {subjectIds: {p0: perfectScore, p1: perfectScore, p3: perfectScore}},
          p3: {subjectIds: {p0: perfectScore, p1: perfectScore, p2: perfectScore}},
        }
      }
      const pool = {...poolDefaults, memberFeedback}

      const appraiser = new MembersGetTeammatesTheyGaveGoodFeedbackAppraiser(pool)
      const score = appraiser.score(teamFormationPlan)
      const expectedScore = 0.75 * bestScoreForRepeatTeammate + // 3 members are perfectly happy
                            0.125 * bestScoreForRepeatTeammate // 1 member is 50% happy
      expect(score).to
        .be.gt(expectedScore - 0.000001)
        .and.lt(expectedScore + 0.000001)
    })
  })

  context('when the teams are not complete', function () {
    const memberFeedback = {
      respondentIds: {
        p0: {subjectIds: {p1: 0  , p2: 100, p3: 0}},
        p1: {subjectIds: {p0: 0  , p2: 0  , p3: 0}},
        p2: {subjectIds: {p0: 100, p1: 0  , p3: 0}},
        p3: {subjectIds: {p0: 0  , p1: 0  , p2: 0}},
      }
    }

    it('assumes unassigned members will all get perfect teammates', function () {
      const teamFormationPlan = {
        teams: [
          {goalDescriptor: 'g1', memberIds: ['p0', 'p2']},
          {goalDescriptor: 'g3', memberIds: []},
        ]
      }
      const pool = {...poolDefaults, memberFeedback}
      const appraiser = new MembersGetTeammatesTheyGaveGoodFeedbackAppraiser(pool)
      const score = appraiser.score(teamFormationPlan)

      expect(score).to.eq(0.5)
    })

    it('assumes members without teammates yet will all get perfect teammates', function () {
      const teamFormationPlan = {
        teams: [
          {goalDescriptor: 'g1', memberIds: ['p0', 'p2']},
          {goalDescriptor: 'g3', memberIds: ['p1']},
        ]
      }
      const pool = {...poolDefaults, memberFeedback}
      const appraiser = new MembersGetTeammatesTheyGaveGoodFeedbackAppraiser(pool)
      const score = appraiser.score(teamFormationPlan)

      expect(score).to.eq(0.5)
    })
  })
})
