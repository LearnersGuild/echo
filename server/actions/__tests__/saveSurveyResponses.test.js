/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback */
import {withDBCleanup, useFixture} from 'src/test/helpers'
import factory from 'src/test/factories'
import {Response} from 'src/server/services/dataService'

import saveSurveyResponses from '../saveSurveyResponses'

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.buildSurvey()

  beforeEach(async function () {
    await this.buildSurvey()
    const playerId = this.project.playerIds[0]
    this.currentUser = await factory.build('user', {id: playerId})
  })

  it('create new responses and returns the ids', async function () {
    const args = {
      responses: [
        {
          respondentId: this.currentUser.id,
          surveyId: this.survey.id,
          questionId: this.surveyQuestion.id,
          values: [{subjectId: this.survey.questionRefs[0].subjectIds[0], value: 'response'}],
        }
      ],
      projectName: this.project.name
    }

    const [returnedResponseId] = await saveSurveyResponses(args)

    const response = await Response.get(returnedResponseId)
    return expect(response).to.exist
  })
})
