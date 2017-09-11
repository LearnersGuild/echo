/* eslint-env mocha */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import nock from 'nock'

import config from 'src/config'
import {Cycle, Project} from 'src/server/services/dataService'
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
        await Project.get(this.project.id).update({
          retrospectiveSurveyId: this.survey.id,
        })
      }
    })
  },
  buildSurvey() {
    beforeEach(function () {
      this.buildSurvey = async function (args = {}) {
        const {
          type = 'retrospective',
          project = null,
          ...surveyAttrs
        } = args
        this.project = project || await factory.create('project')
        this.cycleId = this.project.cycleId
        if (!surveyAttrs.questionRefs) {
          this.surveyQuestion = await factory.create('question', {
            subjectType: 'member',
            responseType: 'text',
          })
          surveyAttrs.questionRefs = this.project.memberIds.map(memberId => ({
            subjectIds: () => [memberId],
            questionId: this.surveyQuestion.id
          }))
        }
        this.survey = await factory.create('survey', {
          ...surveyAttrs,
          questionRefs: surveyAttrs.questionRefs.map(({subjectIds, ...rest}) => ({
            subjectIds: typeof subjectIds === 'function' ? subjectIds() : subjectIds,
            ...rest
          })),
        })
        this.project = await Project.get(this.project.id).update({
          [`${type}SurveyId`]: this.survey.id,
        })
        return this.survey
      }
    })
  },
  setCurrentCycleAndUserForProject() {
    beforeEach(function () {
      this.setCurrentCycleAndUserForProject = async function (project) {
        this.currentCycle = await Cycle.get(project.cycleId)
        this.currentUser = await factory.build('user', {id: project.memberIds[0]})
        this.member = await factory.build('member', {id: project.memberIds[0], chapterId: project.chapterId})
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
  nockGetGoalInfo(goalNumber, {times = 1} = {}, overrideProps = {}) {
    this.apiScope = nock(config.server.goalLibrary.baseURL)
      .get(`/api/goals/${goalNumber}.json`)
      .times(times)
      .reply(200, {
        /* eslint-disable camelcase */
        goal_id: goalNumber,
        team_size: 2,
        url: `${config.server.goalLibrary.baseURL}/goals/${goalNumber}-Goal_Title.html`,
        title: 'Goal Title',
        phase: 1,
        dynamic: false,
        labels: [],
        ...overrideProps,
        /* eslint-enable camelcase */
      })
  },
  nockChatServiceCache(channels = [], users = []) {
    const channelList = channels.map(channel => ({
      id: channel,
      name: channel,
    }))
    const userList = users.map(user => ({
      id: user,
      name: user,
    }))
    this.apiScope = nock(config.server.chat.baseURL)
      .persist()
      .get(`/api/channels.list?token=${config.server.chat.token}`)
      .reply(200, {
        ok: true,
        channels: channelList,
      })
      .get(`/api/users.list?token=${config.server.chat.token}`)
      .reply(200, {
        ok: true,
        members: userList,
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
