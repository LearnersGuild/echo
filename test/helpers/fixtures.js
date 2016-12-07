/* eslint-env mocha */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import nock from 'nock'

import config from 'src/config'
import {
  getProjectById,
  updateProject,
  insertProjects,
} from 'src/server/db/project'
import {getCycleById} from 'src/server/db/cycle'
import factory from 'src/test/factories'

export const useFixture = {
  buildOneQuestionSurvey() {
    beforeEach(function () {
      this.buildOneQuestionSurvey = async function ({questionAttrs, subjectIds}) {
        this.project = await factory.create('project')
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
      this.buildSurvey = async function (questionRefs, type = 'retrospective') {
        this.project = await factory.create('project')
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
          questionRefs: questionRefs.map(({questionId, subjectIds}) => ({questionId, subjectIds: subjectIds()}))
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
        this.project = await factory.create('project', {chapterId: this.chapter.id})
        this.cycle = await getCycleById(this.project.cycleId)
        if (!questionRefs) {
          this.questionA = await factory.create('question',
            {body: 'A', responseType: 'percentage', subjectType: 'project'})
          this.questionB = await factory.create('question',
            {body: 'B', responseType: 'percentage', subjectType: 'project'})
          questionRefs = [
            {name: 'A', questionId: this.questionA.id, subjectIds: [this.project.id]},
            {name: 'B', questionId: this.questionB.id, subjectIds: [this.project.id]},
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
              Object.assign({}, questionData, {body: 'quality'}),
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
  nockIDMGetUsersById(users) {
    this.apiScope = nock(config.server.idm.baseURL)
      .post('/graphql')
      .reply(200, {
        data: {
          getUsersByIds: users,
        },
      })
  },
  nockClean() {
    nock.cleanAll()
    this.apiScope = null
  },
  nockIDMfindUsers(users) {
    this.apiScope = nock(config.server.idm.baseURL)
      .post('/graphql')
      .reply(200, {
        data: {
          findUsers: users,
        },
      })
  },
  nockfetchGoalInfo(goalNumber) {
    this.apiScope = nock('https://api.github.com')
      .get(`/repos/GuildCraftsTesting/web-development-js-testing/issues/${goalNumber}`)
      .reply(200, {
        number: goalNumber,
        labels: [],
      })
  },
}
