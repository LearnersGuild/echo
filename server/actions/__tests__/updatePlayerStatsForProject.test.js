/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
/* eslint key-spacing: [2, { "mode": "minimum" }] */
import factory from 'src/test/factories'
import {withDBCleanup, useFixture, mockIdmUsersById} from 'src/test/helpers'
import {getPlayerById} from 'src/server/db/player'
import {findQuestionsByStat} from 'src/server/db/question'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import reloadSurveyAndQuestionData from 'src/server/actions/reloadSurveyAndQuestionData'
import {Project} from 'src/server/services/dataService'

import updatePlayerStatsForProject from 'src/server/actions/updatePlayerStatsForProject'

describe(testContext(__filename), function () {
  describe('updatePlayerStatsForProject', function () {
    withDBCleanup()
    this.timeout(8000)
    useFixture.buildSurvey()

    beforeEach('Setup Survey Data', async function () {
      await reloadSurveyAndQuestionData()
      const getQId = descriptor => findQuestionsByStat(descriptor).filter({active: true})(0)('id')

      const playerQuestions = [
        {value: 6, questionId: await getQId(STAT_DESCRIPTORS.TECHNICAL_HEALTH)},
        {value: 5, questionId: await getQId(STAT_DESCRIPTORS.CULTURE_CONTRIBUTION)},
        {value: 4, questionId: await getQId(STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_STRUCTURE)},
        {value: 5, questionId: await getQId(STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_SAFETY)},
        {value: 6, questionId: await getQId(STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_TRUTH)},
        {value: 6, questionId: await getQId(STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_CHALLENGE)},
        {value: 5, questionId: await getQId(STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_SUPPORT)},
        {value: 4, questionId: await getQId(STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_ENGAGEMENT)},
        {value: 5, questionId: await getQId(STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_ENJOYMENT)},
        {value: 6, questionId: await getQId(STAT_DESCRIPTORS.TEAM_PLAY)},
        {value: 5, questionId: await getQId(STAT_DESCRIPTORS.RECEPTIVENESS)},
        {value: 4, questionId: await getQId(STAT_DESCRIPTORS.FLEXIBLE_LEADERSHIP)},
        {value: 3, questionId: await getQId(STAT_DESCRIPTORS.RESULTS_FOCUS)},
        {value: 2, questionId: await getQId(STAT_DESCRIPTORS.FRICTION_REDUCTION)},
        {value: 20, questionId: await getQId(STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION)},
        {value: 7, questionId: await getQId(STAT_DESCRIPTORS.CHALLENGE)},
      ]

      const projectQuestions = [
        {value: '35', questionId: await getQId(STAT_DESCRIPTORS.PROJECT_HOURS)},
        {value: 7, questionId: await getQId(STAT_DESCRIPTORS.CHALLENGE)},
      ]

      await this.buildSurvey([
        ...playerQuestions.map(q => ({questionId: q.questionId, subjectIds: () => this.project.playerIds})),
        ...projectQuestions.map(q => ({questionId: q.questionId, subjectIds: () => this.project.id})),
      ])

      const responseData = []
      this.project.playerIds.forEach(respondentId => {
        this.project.playerIds.forEach(subjectId => {
          playerQuestions.forEach(q => {
            responseData.push({
              questionId: q.questionId,
              surveyId: this.survey.id,
              respondentId,
              subjectId,
              value: q.value,
            })
          })
        })

        projectQuestions.forEach(q => {
          responseData.push({
            questionId: q.questionId,
            surveyId: this.survey.id,
            respondentId,
            subjectId: this.project.id,
            value: q.value,
          })
        })
      })

      await factory.createMany('response', responseData)
    })

    it('updates the project and players\' stats based on the survey responses', async function () {
      const playerId = this.project.playerIds[0]
      const playerEloRating = 1300

      await mockIdmUsersById(this.project.playerIds)
      await getPlayerById(playerId).update({stats: {elo: {rating: playerEloRating}}}).run()
      await updatePlayerStatsForProject(this.project)

      const expectedTeamHours = 140
      const updatedProject = await Project.get(this.project.id)

      expect(updatedProject.stats.hours).to.eq(expectedTeamHours)

      const expectedECC = 20 * this.project.playerIds.length
      const updatedPlayer = await getPlayerById(playerId)

      expect(updatedPlayer.stats.ecc).to.eq(expectedECC)
      expect(updatedPlayer.stats.xp).to.eq(28)
      expect(updatedPlayer.stats.elo).to.deep.eq({
        rating: 1204,
        matches: 3,
      })
      expect(updatedPlayer.stats.projects).to.deep.eq({
        [this.project.id]: {
          challenge: 7,
          th: 83,
          cc: 67,
          cultureContributionStructure: 50,
          cultureContributionSafety: 67,
          cultureContributionTruth: 83,
          cultureContributionChallenge: 83,
          cultureContributionSupport: 67,
          cultureContributionEngagement: 50,
          cultureContributionEnjoyment: 67,
          tp: 83,
          receptiveness: 67,
          flexibleLeadership: 50,
          resultsFocus: 33,
          frictionReduction: 17,
          ec: 25,
          ecd: -5,
          abc: 4,
          rc: 20,
          rcSelf: 20,
          rcOther: 20,
          rcPerHour: 0.57, // 35 hours / 20% RC
          hours: 35,
          teamHours: expectedTeamHours,
          ecc: expectedECC,
          xp: 28,
          elo: {
            rating: 1204,
            matches: 3,
            score: 0.57,
            kFactor: 100,
          }
        },
      })
    })

    it('does not compute Elo for pro players', async function () {
      const playerInfoOverrides = this.project.playerIds.map((id, i) => ({
        id,
        roles: i === 0 ? ['proplayer', 'player'] : ['player'],
      }))
      await mockIdmUsersById(this.project.playerIds, playerInfoOverrides)

      const [proPlayerId, regularPlayerId] = this.project.playerIds
      await getPlayerById(proPlayerId).replace(p => p.without('stats').merge({stats: p('stats').without('elo')})).run()

      await updatePlayerStatsForProject(this.project)

      const updatedProPlayer = await getPlayerById(proPlayerId)
      const updatedRegularPlayer = await getPlayerById(regularPlayerId)

      expect(updatedProPlayer.stats).to.not.contain.all.keys('elo')
      expect(updatedProPlayer.stats.projects[this.project.id]).to.not.contain.all.keys('elo')

      expect(updatedRegularPlayer.stats).to.contain.all.keys('elo')
      expect(updatedRegularPlayer.stats.projects[this.project.id]).to.contain.all.keys('elo')
    })
  })
})

/**
 * Test match results:
 *
 *   1300  1000  1000  1000
 *   a     b     c     d
 *   --------------------------------------
 *   1300, 1000 =  1265, 1035
 *   a     b       a     b
 *   --------------------------------------
 *   1300, 1000 -> 1265, 1000 =  1233, 1032
 *   a     c       a     c       a     c
 *   --------------------------------------
 *   1300, 1000 -> 1233, 1000 =  1204, 1029
 *   a     d       a     d       a     d
 *   --------------------------------------
 *   1000, 1000 -> 1035, 1032 =  1035, 1032
 *   b     c       b     c       b     c
 *   --------------------------------------
 *   1000, 1000 -> 1035, 1029 =  1034, 1030
 *   b     d       b     d       b     d
 *   --------------------------------------
 *   1000, 1000 -> 1032, 1030 =  1032, 1030
 *   c     d       c     d       c     d
 *   --------------------------------------
 *   1204  1034  1032  1030
 *   a     b     c     d
*/
