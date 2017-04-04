/* eslint-env mocha */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import Promise from 'bluebird'
import nock from 'nock'

import config from 'src/config'
import {
  getProjectById,
  updateProject,
  insertProjects,
} from 'src/server/db/project'
import {getCycleById} from 'src/server/db/cycle'
import factory from 'src/test/factories'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {PROJECT_STATES} from 'src/common/models/project'

export const useFixture = {
  buildOneQuestionSurvey() {
    beforeEach(function () {
      this.buildOneQuestionSurvey = async function ({questionAttrs, subjectIds, projectState = PROJECT_STATES.REVIEW}) {
        this.project = await factory.create('project', {state: projectState})
        this.cycleId = this.project.cycleId
        this.question = await factory.create('question', questionAttrs)
        this.survey = await factory.create('survey', {
          questionRefs: [{questionId: this.question.id, subjectIds: subjectIds()}]
        })
        await updateProject({
          id: this.project.id,
          retrospectiveSurveyId: this.survey.id,
        })
      }
    })
  },
  buildSurvey() {
    beforeEach(function () {
      this.buildSurvey = async function (questionRefs, type = 'retrospective', project = null) {
        this.project = project || await factory.create('project', {
          state: PROJECT_STATES.REVIEW,
          reviewStartedAt: new Date(),
        })
        this.cycleId = this.project.cycleId
        if (!questionRefs) {
          this.surveyQuestion = await factory.create('question', {
            subjectType: 'player',
            responseType: 'text',
          })
          questionRefs = this.project.playerIds.map(playerId => ({
            subjectIds: () => [playerId],
            questionId: this.surveyQuestion.id
          }))
        }
        this.survey = await factory.create('survey', {
          questionRefs: questionRefs.map(({subjectIds, ...rest}) => ({
            subjectIds: typeof subjectIds === 'function' ? subjectIds() : subjectIds,
            ...rest
          }))
        })
        await updateProject({
          id: this.project.id,
          [`${type}SurveyId`]: this.survey.id,
        })
        this.project = await getProjectById(this.project.id)
        return this.survey
      }
    })
  },
  createProjectReviewSurvey() {
    beforeEach(function () {
      this.createProjectReviewSurvey = async function (questionRefs) {
        this.chapter = await factory.create('chapter')
        this.project = await factory.create('project', {
          chapterId: this.chapter.id,
          state: PROJECT_STATES.REVIEW,
        })
        this.cycle = await getCycleById(this.project.cycleId)
        if (!questionRefs) {
          const statCompleteness = await factory.create('stat', {descriptor: STAT_DESCRIPTORS.PROJECT_COMPLETENESS})
          const question = {responseType: 'percentage', subjectType: 'project'}
          this.questionCompleteness = await factory.create('question', {...question, body: 'completeness', statId: statCompleteness.id})
          questionRefs = [
            {name: 'completeness', questionId: this.questionCompleteness.id, subjectIds: [this.project.id]},
          ]
        }
        this.survey = await factory.create('survey', {questionRefs})
        await updateProject({
          id: this.project.id,
          projectReviewSurveyId: this.survey.id,
        })
      }
    })
  },
  createChapterInReflectionState() {
    beforeEach(function () {
      this.createChapterInReflectionState = async function () {
        this.chapter = await factory.create('chapter')
        this.projects = await factory.buildMany('project', {chapterId: this.chapter.id}, 4)
        // make sure cycles line up for all projects
        this.projects.slice(1).forEach(project => {
          project.cycleId = this.projects[0].cycleId
        })
        await insertProjects(this.projects)
        this.cycle = await getCycleById(this.projects[0].cycleId)

        // create a project review survey for each project
        this.surveys = await Promise.all(this.projects.map(async project => {
          return (async () => {
            const questionData = {responseType: 'percentage', subjectType: 'project'}
            const questions = await factory.createMany('question', [
              Object.assign({}, questionData, {body: 'completeness'}),
            ], 2)
            const questionRefs = questions.map(question => ({
              name: question.body,
              questionId: question.id,
              subjectIds: [project.id],
            }))
            const survey = await factory.create('survey', {questionRefs})
            await updateProject({
              id: project.id,
              projectReviewSurveyId: survey.id,
            })
            return survey
          })()
        }))
      }
    })
  },
  setCurrentCycleAndUserForProject() {
    beforeEach(function () {
      this.setCurrentCycleAndUserForProject = async function (project) {
        this.currentCycle = await getCycleById(project.cycleId)
        this.currentUser = await factory.build('user', {id: project.playerIds[0]})
      }
    })
  },
  createChapterWithCycles() {
    before('define createChapterWithCycles helper', function () {
      this.createChapterWithCycles = (cycleAttrs = {}) => {
        const now = new Date()
        return factory.create('chapter')
          .then(chapter => {
            this.chapter = chapter
            const overwriteObjs = Array.from(Array(4).keys()).map(i => {
              const startTimestamp = new Date(now)
              startTimestamp.setDate(startTimestamp.getDate() + (i * 7))
              return Object.assign({}, {
                chapterId: chapter.id,
                startTimestamp,
              }, cycleAttrs)
            })
            return factory.createMany('cycle', overwriteObjs)
              .then(cycles => {
                this.cycles = cycles
              })
          })
      }
    })
  },
  nockClean() {
    nock.cleanAll()
    this.apiScope = null
  },
  nockIDMGraphQL(dataKey, data, {times = 1} = {}) {
    this.apiScope = nock(config.server.idm.baseURL)
      .post('/graphql')
      .times(times)
      .reply(200, {
        data: {[dataKey]: data},
      })
  },
  nockIDMGetUser(user) {
    this.apiScope = nock(config.server.idm.baseURL)
      .post('/graphql')
      .reply(200, {
        data: {
          getUser: user,
        },
      })
  },
  nockIDMGetUsersById(users, {times = 1} = {}) {
    this.apiScope = nock(config.server.idm.baseURL)
      .post('/graphql')
      .times(times)
      .reply(200, {
        data: {
          getUsersByIds: users,
        },
      })
  },
  nockIDMFindUsers(users, {times = 1} = {}) {
    this.apiScope = nock(config.server.idm.baseURL)
      .post('/graphql')
      .times(times)
      .reply(200, {
        data: {
          findUsers: users,
        },
      })
  },
  nockGetGoalInfo(goalNumber, {times = 1} = {}) {
    this.apiScope = nock(config.server.goalLibrary.baseURL)
      .get(`/api/goals/${goalNumber}.json`)
      .times(times)
      .reply(200, {
        /* eslint-disable camelcase */
        goal_id: goalNumber,
        team_size: 2,
        url: `${config.server.goalLibrary.baseURL}/goals/${goalNumber}-Goal_Title.html`,
        title: 'Goal Title',
        /* eslint-enable camelcase */
        labels: [],
      })
  },
  ensureNoGlobalWindow() {
    before(function () {
      this.window = global.window
      global.window = undefined
    })
    after(function () {
      global.window = this.window
    })
  }
}
