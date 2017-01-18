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

import updatePlayerStatsForProject from 'src/server/actions/updatePlayerStatsForProject'

describe(testContext(__filename), function () {
  describe('updatePlayerStatsForProject', function () {
    withDBCleanup()
    this.timeout(8000)
    useFixture.buildSurvey()

    beforeEach('Setup Survey Data', async function () {
      useFixture.nockClean()
      await reloadSurveyAndQuestionData()

      this.setupSurveyData = async customResponses => {
        const {playerResponses, projectResponses} = await _getQuestionsAndReponses(customResponses)

        await this.buildSurvey([
          ...playerResponses.map(q => ({questionId: q.questionId, subjectIds: () => this.project.playerIds})),
          ...projectResponses.map(q => ({questionId: q.questionId, subjectIds: () => this.project.id})),
        ])

        const responseData = []
        this.project.playerIds.forEach((respondentId, respondentNum) => {
          this.project.playerIds.forEach((subjectId, subjectNum) => {
            playerResponses.forEach(qr => {
              responseData.push({
                questionId: qr.questionId,
                surveyId: this.survey.id,
                respondentId,
                subjectId,
                value: qr.value ? qr.value : qr.values[subjectNum],
              })
            })
          })

          projectResponses.forEach(qr => {
            responseData.push({
              questionId: qr.questionId,
              surveyId: this.survey.id,
              respondentId,
              subjectId: this.project.id,
              value: qr.value ? qr.value : qr.values[respondentNum],
            })
          })
        })

        await factory.createMany('response', responseData)
      }
    })

    it('updates the players\' stats based on the survey responses', async function () {
      await this.setupSurveyData()
      const playerId = this.project.playerIds[0]

      await mockIdmUsersById(this.project.playerIds)
      await getPlayerById(playerId).update({stats: {elo: {rating: 1300}}}).run()
      await updatePlayerStatsForProject(this.project)
      const updatedPlayer = await getPlayerById(playerId)

      expect(updatedPlayer.stats.ecc).to.eq(100)
      expect(updatedPlayer.stats.xp).to.eq(35)
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
          ecd: 0,
          abc: 4,
          rc: 25,
          rcSelf: 25,
          rcOther: 25,
          rcPerHour: 0.71,
          hours: 35,
          teamHours: 140,
          ecc: 100,
          xp: 35,
          elo: {
            rating: 1204,
            matches: 3,
            score: 0.71,
            kFactor: 100,
          }
        },
      })
    })

    it('does not compute Elo for coaches', async function () {
      await this.setupSurveyData()

      const playerInfoOverrides = this.project.playerIds.map((id, i) => ({
        id,
        roles: i === 0 ? ['coach', 'player'] : ['player'],
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

    it('ignores players who have reported 0 hours', async function () {
      await this.setupSurveyData({
        [STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION]: [35, 25, 25, 15],
        [STAT_DESCRIPTORS.PROJECT_HOURS]: ['35', '35', '35', '0'],
      })

      const activePlayerId = this.project.playerIds[0]
      const inactivePlayerId = this.project.playerIds[3]
      const initialInactivePlayer = await getPlayerById(inactivePlayerId)

      await mockIdmUsersById(this.project.playerIds)
      await getPlayerById(activePlayerId).update({stats: {elo: {rating: 1300}}}).run()
      await updatePlayerStatsForProject(this.project)
      const updatedActivePlayer = await getPlayerById(activePlayerId)
      const updatedInactivePlayer = await getPlayerById(inactivePlayerId)

      // the stats for the inactive player shouldn't change
      expect(initialInactivePlayer.stats).to.deep.eq(updatedInactivePlayer.stats)

      // the stats for the active player should be such that the inactive player
      // was ignored
      expect(updatedActivePlayer.stats.ecc).to.eq(123)
      expect(updatedActivePlayer.stats.xp).to.eq(43.05)
      expect(updatedActivePlayer.stats.elo).to.deep.eq({
        rating: 1250,
        matches: 2,
      })
      expect(updatedActivePlayer.stats.projects).to.deep.eq({
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
          ec: 33,
          ecd: 8,
          abc: 3,
          rc: 41,
          rcSelf: 41,
          rcOther: 41,
          rcPerHour: 1.17,
          hours: 35,
          teamHours: 105,
          ecc: 123,
          xp: 43.05,
          elo: {
            rating: 1250,
            matches: 2,
            score: 1.17,
            kFactor: 100,
          }
        },
      })
    })
  })
})

async function _getQuestionsAndReponses(customResponses = {}) {
  const playerDescriptors = [
    STAT_DESCRIPTORS.TECHNICAL_HEALTH,
    STAT_DESCRIPTORS.CULTURE_CONTRIBUTION,
    STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_STRUCTURE,
    STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_SAFETY,
    STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_TRUTH,
    STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_CHALLENGE,
    STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_SUPPORT,
    STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_ENGAGEMENT,
    STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_ENJOYMENT,
    STAT_DESCRIPTORS.TEAM_PLAY,
    STAT_DESCRIPTORS.RECEPTIVENESS,
    STAT_DESCRIPTORS.FLEXIBLE_LEADERSHIP,
    STAT_DESCRIPTORS.RESULTS_FOCUS,
    STAT_DESCRIPTORS.FRICTION_REDUCTION,
    STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION,
    STAT_DESCRIPTORS.CHALLENGE,
  ]
  const projectDescriptors = [
    STAT_DESCRIPTORS.PROJECT_HOURS,
    STAT_DESCRIPTORS.CHALLENGE,
  ]

  const defaultResponses = {
    [STAT_DESCRIPTORS.TECHNICAL_HEALTH]: 6,
    [STAT_DESCRIPTORS.CULTURE_CONTRIBUTION]: 5,
    [STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_STRUCTURE]: 4,
    [STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_SAFETY]: 5,
    [STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_TRUTH]: 6,
    [STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_CHALLENGE]: 6,
    [STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_SUPPORT]: 5,
    [STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_ENGAGEMENT]: 4,
    [STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_ENJOYMENT]: 5,
    [STAT_DESCRIPTORS.TEAM_PLAY]: 6,
    [STAT_DESCRIPTORS.RECEPTIVENESS]: 5,
    [STAT_DESCRIPTORS.FLEXIBLE_LEADERSHIP]: 4,
    [STAT_DESCRIPTORS.RESULTS_FOCUS]: 3,
    [STAT_DESCRIPTORS.FRICTION_REDUCTION]: 2,
    [STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION]: 20,
    [STAT_DESCRIPTORS.CHALLENGE]: 7,
    [STAT_DESCRIPTORS.PROJECT_HOURS]: '35',
    [STAT_DESCRIPTORS.CHALLENGE]: 7,
  }
  const responses = {...defaultResponses, ...customResponses}

  const getQId = descriptor => findQuestionsByStat(descriptor).filter({active: true})(0)('id')
  const qAndR = async descriptor => {
    const val = responses[descriptor]
    const qr = {questionId: await getQId(descriptor)}
    if (Array.isArray(val)) {
      qr.values = val
    } else {
      qr.value = val
    }
    return qr
  }

  const playerResponses = await Promise.all(playerDescriptors.map(async desc => await qAndR(desc)))
  const projectResponses = await Promise.all(projectDescriptors.map(async desc => await qAndR(desc)))

  return {playerResponses, projectResponses}
}

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
