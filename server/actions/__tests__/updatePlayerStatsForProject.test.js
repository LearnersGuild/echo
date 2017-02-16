/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
/* eslint key-spacing: [2, { "mode": "minimum" }] */
import factory from 'src/test/factories'
import {withDBCleanup, useFixture, mockIdmUsersById} from 'src/test/helpers'
import {getPlayerById} from 'src/server/db/player'
import {saveSurvey} from 'src/server/db/survey'
import {findQuestionsByStat} from 'src/server/db/question'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {PROJECT_DEFAULT_EXPECTED_HOURS} from 'src/common/models/project'
import reloadSurveyAndQuestionData from 'src/server/actions/reloadSurveyAndQuestionData'

import updatePlayerStatsForProject from 'src/server/actions/updatePlayerStatsForProject'

const {
  CHALLENGE,
  CULTURE_CONTRIBUTION,
  CULTURE_CONTRIBUTION_CHALLENGE,
  CULTURE_CONTRIBUTION_ENGAGEMENT,
  CULTURE_CONTRIBUTION_ENJOYMENT,
  CULTURE_CONTRIBUTION_SAFETY,
  CULTURE_CONTRIBUTION_STRUCTURE,
  CULTURE_CONTRIBUTION_SUPPORT,
  CULTURE_CONTRIBUTION_TRUTH,
  ELO,
  ESTIMATION_ACCURACY,
  ESTIMATION_BIAS,
  EXPERIENCE_POINTS,
  LEVEL,
  PROJECT_HOURS,
  PROJECT_TIME_OFF_HOURS,
  RELATIVE_CONTRIBUTION,
  RELATIVE_CONTRIBUTION_AGGREGATE_CYCLES,
  RELATIVE_CONTRIBUTION_DELTA,
  RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES,
  RELATIVE_CONTRIBUTION_EXPECTED,
  RELATIVE_CONTRIBUTION_HOURLY,
  RELATIVE_CONTRIBUTION_OTHER,
  RELATIVE_CONTRIBUTION_SELF,
  TEAM_HOURS,
  TEAM_PLAY,
  TEAM_PLAY_FLEXIBLE_LEADERSHIP,
  TEAM_PLAY_FRICTION_REDUCTION,
  TEAM_PLAY_RECEPTIVENESS,
  TEAM_PLAY_RESULTS_FOCUS,
  TECHNICAL_HEALTH,
} = STAT_DESCRIPTORS

describe(testContext(__filename), function () {
  describe('updatePlayerStatsForProject', function () {
    withDBCleanup()
    this.timeout(8000)
    useFixture.buildSurvey()

    describe('when there are multiple players on a project', function () {
      beforeEach('Setup Survey Data (multi-player)', async function () {
        useFixture.nockClean()
        await reloadSurveyAndQuestionData()

        this.setupSurveyData = async customResponses => {
          const {playerResponses, projectResponses} = await _getQuestionsAndReponsesMP(customResponses)

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

            this.survey.completedBy.push(respondentId)
          })

          await saveSurvey(this.survey)
          await factory.createMany('response', responseData)
        }
      })

      it('updates the players\' stats based on the survey responses', async function () {
        await this.setupSurveyData()
        const playerId = this.project.playerIds[0]

        await mockIdmUsersById(this.project.playerIds)
        await getPlayerById(playerId).update({stats: {[ELO]: {rating: 1300}}}).run()
        await updatePlayerStatsForProject(this.project)
        const updatedPlayer = await getPlayerById(playerId)

        expect(updatedPlayer.stats[RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]).to.eq(100)
        expect(updatedPlayer.stats[EXPERIENCE_POINTS]).to.eq(35)
        expect(updatedPlayer.stats[ELO]).to.deep.eq({
          rating: 1279,
          matches: 3,
        })
        expect(updatedPlayer.stats.projects).to.deep.eq({
          [this.project.id]: {
            [CHALLENGE]: 7,
            [TECHNICAL_HEALTH]: 83,
            [CULTURE_CONTRIBUTION]: 67,
            [CULTURE_CONTRIBUTION_STRUCTURE]: 50,
            [CULTURE_CONTRIBUTION_SAFETY]: 67,
            [CULTURE_CONTRIBUTION_TRUTH]: 83,
            [CULTURE_CONTRIBUTION_CHALLENGE]: 83,
            [CULTURE_CONTRIBUTION_SUPPORT]: 67,
            [CULTURE_CONTRIBUTION_ENGAGEMENT]: 50,
            [CULTURE_CONTRIBUTION_ENJOYMENT]: 67,
            [TEAM_PLAY]: 83,
            [TEAM_PLAY_RECEPTIVENESS]: 67,
            [TEAM_PLAY_FLEXIBLE_LEADERSHIP]: 50,
            [TEAM_PLAY_RESULTS_FOCUS]: 33,
            [TEAM_PLAY_FRICTION_REDUCTION]: 17,
            [RELATIVE_CONTRIBUTION_EXPECTED]: 25,
            [RELATIVE_CONTRIBUTION_DELTA]: 0,
            [RELATIVE_CONTRIBUTION_AGGREGATE_CYCLES]: 4,
            [RELATIVE_CONTRIBUTION]: 25,
            [RELATIVE_CONTRIBUTION_SELF]: 25,
            [RELATIVE_CONTRIBUTION_OTHER]: 25,
            [RELATIVE_CONTRIBUTION_HOURLY]: 0.71,
            [ESTIMATION_BIAS]: 0,
            [ESTIMATION_ACCURACY]: 100,
            [PROJECT_HOURS]: 35,
            [TEAM_HOURS]: 140,
            [RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]: 100,
            [EXPERIENCE_POINTS]: 35,
            [ELO]: {
              rating: 1279,
              matches: 3,
              score: 0.71,
              kFactor: 20,
            },
            [LEVEL]: {
              ending: 1,
              starting: 0,
            },
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

      it('ignores players who have reported "time off hours" >= "expected hours" in the project', async function () {
        await this.setupSurveyData({
          [STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION]: [35, 25, 25, 15],
          [STAT_DESCRIPTORS.PROJECT_TIME_OFF_HOURS]: [3, 3, 3, PROJECT_DEFAULT_EXPECTED_HOURS + 2],
        })

        const activePlayerId = this.project.playerIds[0]
        const inactivePlayerId = this.project.playerIds[3]
        const initialInactivePlayer = await getPlayerById(inactivePlayerId)

        await mockIdmUsersById(this.project.playerIds)
        await getPlayerById(activePlayerId).update({stats: {[ELO]: {rating: 1300}}}).run()
        await updatePlayerStatsForProject(this.project)
        const updatedActivePlayer = await getPlayerById(activePlayerId)
        const updatedInactivePlayer = await getPlayerById(inactivePlayerId)

        // the stats for the inactive player shouldn't change
        expect(initialInactivePlayer.stats).to.deep.eq(updatedInactivePlayer.stats)

        // the stats for the active player should be such that the inactive player
        // was ignored
        expect(updatedActivePlayer.stats[RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]).to.eq(123)
        expect(updatedActivePlayer.stats[EXPERIENCE_POINTS]).to.eq(43.05)
        expect(updatedActivePlayer.stats[LEVEL]).to.eq(1)
        expect(updatedActivePlayer.stats[ELO]).to.deep.eq({
          rating: 1296,
          matches: 2,
        })
        expect(updatedActivePlayer.stats.projects).to.deep.eq({
          [this.project.id]: {
            [CHALLENGE]: 7,
            [TECHNICAL_HEALTH]: 83,
            [CULTURE_CONTRIBUTION]: 67,
            [CULTURE_CONTRIBUTION_STRUCTURE]: 50,
            [CULTURE_CONTRIBUTION_SAFETY]: 67,
            [CULTURE_CONTRIBUTION_TRUTH]: 83,
            [CULTURE_CONTRIBUTION_CHALLENGE]: 83,
            [CULTURE_CONTRIBUTION_SUPPORT]: 67,
            [CULTURE_CONTRIBUTION_ENGAGEMENT]: 50,
            [CULTURE_CONTRIBUTION_ENJOYMENT]: 67,
            [TEAM_PLAY]: 83,
            [TEAM_PLAY_RECEPTIVENESS]: 67,
            [TEAM_PLAY_FLEXIBLE_LEADERSHIP]: 50,
            [TEAM_PLAY_RESULTS_FOCUS]: 33,
            [TEAM_PLAY_FRICTION_REDUCTION]: 17,
            [RELATIVE_CONTRIBUTION_EXPECTED]: 33,
            [RELATIVE_CONTRIBUTION_DELTA]: 8,
            [RELATIVE_CONTRIBUTION_AGGREGATE_CYCLES]: 3,
            [RELATIVE_CONTRIBUTION]: 41,
            [RELATIVE_CONTRIBUTION_SELF]: 41,
            [RELATIVE_CONTRIBUTION_OTHER]: 41,
            [RELATIVE_CONTRIBUTION_HOURLY]: 1.17,
            [ESTIMATION_BIAS]: 0,
            [ESTIMATION_ACCURACY]: 100,
            [PROJECT_HOURS]: 35,
            [TEAM_HOURS]: 105,
            [RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]: 123,
            [EXPERIENCE_POINTS]: 43.05,
            [ELO]: {
              rating: 1296,
              matches: 2,
              score: 1.17,
              kFactor: 20,
            },
            [LEVEL]: {
              ending: 1,
              starting: 0,
            },
          },
        })
      })

      it('does not update the player\'s stats if the retrospective is still open', async function () {
        await this.setupSurveyData()
        const [firstPlayerId] = this.project.playerIds

        this.survey.completedBy = []
        await saveSurvey(this.survey)

        await mockIdmUsersById(this.project.playerIds)
        await updatePlayerStatsForProject(this.project)
        const firstUpdatedPlayer = await getPlayerById(firstPlayerId)

        expect(firstUpdatedPlayer.stats.projects).to.be.undefined
      })
    })

    describe('when there is a single player on a project', function () {
      beforeEach('Setup Survey Data (single player)', async function () {
        useFixture.nockClean()
        await reloadSurveyAndQuestionData()

        this.setupSurveyData = async customResponses => {
          const responses = await _getQuestionsAndResponsesSP(customResponses)

          await this.buildSurvey(
            responses.map(q => ({questionId: q.questionId, subjectIds: () => this.project.id})),
            'retrospective',
            await factory.create('single player project')
          )

          const responseData = []
          this.project.playerIds.forEach((respondentId, respondentNum) => {
            responses.forEach(qr => {
              responseData.push({
                questionId: qr.questionId,
                surveyId: this.survey.id,
                respondentId,
                subjectId: this.project.id,
                value: qr.value ? qr.value : qr.values[respondentNum],
              })
            })

            this.survey.completedBy.push(respondentId)
          })

          await saveSurvey(this.survey)
          await factory.createMany('response', responseData)
        }
      })

      it('updates the player\'s stats based on the survey responses', async function () {
        await this.setupSurveyData()
        const [playerId] = this.project.playerIds

        await mockIdmUsersById(this.project.playerIds)
        await updatePlayerStatsForProject(this.project)
        const updatedPlayer = await getPlayerById(playerId)

        expect(updatedPlayer.stats[EXPERIENCE_POINTS]).to.eq(35)
        expect(updatedPlayer.stats.projects).to.deep.eq({
          [this.project.id]: {
            [CHALLENGE]: 7,
            [PROJECT_HOURS]: 35,
            [TEAM_HOURS]: 35,
            [EXPERIENCE_POINTS]: 35,
            [LEVEL]: {
              ending: 0,
              starting: 0,
            },
          },
        })
      })
    })
  })
})

const _getQId = descriptor => findQuestionsByStat(descriptor)(0)('id')
const _qAndR = async (descriptor, responses) => {
  const val = responses[descriptor]
  const qr = {questionId: await _getQId(descriptor)}
  if (Array.isArray(val)) {
    qr.values = val
  } else {
    qr.value = val
  }
  return qr
}

async function _getQuestionsAndReponsesMP(customResponses = {}) {
  const playerDescriptors = [
    TECHNICAL_HEALTH,
    CULTURE_CONTRIBUTION,
    CULTURE_CONTRIBUTION_STRUCTURE,
    CULTURE_CONTRIBUTION_SAFETY,
    CULTURE_CONTRIBUTION_TRUTH,
    CULTURE_CONTRIBUTION_CHALLENGE,
    CULTURE_CONTRIBUTION_SUPPORT,
    CULTURE_CONTRIBUTION_ENGAGEMENT,
    CULTURE_CONTRIBUTION_ENJOYMENT,
    TEAM_PLAY,
    TEAM_PLAY_RECEPTIVENESS,
    TEAM_PLAY_FLEXIBLE_LEADERSHIP,
    TEAM_PLAY_RESULTS_FOCUS,
    TEAM_PLAY_FRICTION_REDUCTION,
    RELATIVE_CONTRIBUTION,
  ]
  const projectDescriptors = [
    PROJECT_TIME_OFF_HOURS,
    CHALLENGE,
  ]

  const defaultResponses = {
    [TECHNICAL_HEALTH]: 6,
    [CULTURE_CONTRIBUTION]: 5,
    [CULTURE_CONTRIBUTION_STRUCTURE]: 4,
    [CULTURE_CONTRIBUTION_SAFETY]: 5,
    [CULTURE_CONTRIBUTION_TRUTH]: 6,
    [CULTURE_CONTRIBUTION_CHALLENGE]: 6,
    [CULTURE_CONTRIBUTION_SUPPORT]: 5,
    [CULTURE_CONTRIBUTION_ENGAGEMENT]: 4,
    [CULTURE_CONTRIBUTION_ENJOYMENT]: 5,
    [TEAM_PLAY]: 6,
    [TEAM_PLAY_RECEPTIVENESS]: 5,
    [TEAM_PLAY_FLEXIBLE_LEADERSHIP]: 4,
    [TEAM_PLAY_RESULTS_FOCUS]: 3,
    [TEAM_PLAY_FRICTION_REDUCTION]: 2,
    [RELATIVE_CONTRIBUTION]: 20,
    [PROJECT_TIME_OFF_HOURS]: 3,
    [CHALLENGE]: 7,
  }
  const mergedResponses = {...defaultResponses, ...customResponses}

  const playerResponses = await Promise.all(playerDescriptors.map(async desc => await _qAndR(desc, mergedResponses)))
  const projectResponses = await Promise.all(projectDescriptors.map(async desc => await _qAndR(desc, mergedResponses)))

  return {playerResponses, projectResponses}
}

async function _getQuestionsAndResponsesSP(customResponses = {}) {
  const descriptors = [
    PROJECT_TIME_OFF_HOURS,
    CHALLENGE,
  ]
  const defaultResponses = {
    [PROJECT_TIME_OFF_HOURS]: 3,
    [CHALLENGE]: 7,
  }
  const mergedResponses = {...defaultResponses, ...customResponses}

  return await Promise.all(descriptors.map(async desc => await _qAndR(desc, mergedResponses)))
}
