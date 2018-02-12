import {renderQuestionBodies} from 'src/common/models/survey'
import getMemberInfo from 'src/server/actions/getMemberInfo'
import {Project, getFullSurveyForMember} from 'src/server/services/dataService'
import {customQueryError} from 'src/server/services/dataService/util'
import {LGForbiddenError} from 'src/server/util/error'

export async function compileSurveyDataForMember(memberId, projectId, surveyDescriptor) {
  const survey = await getFullSurveyForMember(memberId, projectId, surveyDescriptor)
    .then(survey => inflateSurveySubjects(survey))
    .then(survey => Object.assign({}, survey, {
      questions: renderQuestionBodies(survey.questions)
    }))
  const surveyCompletedBy = survey.completedBy || []
  const surveyUnlockedFor = survey.unlockedFor || []
  if (surveyCompletedBy.includes(memberId) && !surveyUnlockedFor.includes(memberId)) {
    throw new LGForbiddenError('This survey has been completed and is locked.')
  }
  return survey
}

export function compileSurveyQuestionDataForMember(memberId, questionNumber, projectId, surveyDescriptor) {
  return getFullSurveyForMember(memberId, projectId, surveyDescriptor)('questions')
    .nth(questionNumber - 1)
    .default(customQueryError(`There is no question number ${questionNumber}`))
    .then(question => inflateSurveyQuestionSubjects([question]))
    .then(questions => renderQuestionBodies(questions))
    .then(questions => questions[0])
}

function inflateSurveySubjects(survey) {
  return inflateSurveyQuestionSubjects(survey.questions)
    .then(questions => Object.assign({}, survey, {questions}))
}

async function inflateSurveyQuestionSubjects(questions) {
  const subjectIds = getSubjects(questions)
  const memberInfo = await getMemberInfoByIds(subjectIds)
  const projectInfo = await getProjectInfoByIds(subjectIds)
  const subjectInfo = {...memberInfo, ...projectInfo}

  const inflatedQuestions = questions.map(question => {
    const inflatedSubject = question.subjectIds.map(subjectId => subjectInfo[subjectId])
    return Object.assign({}, question, {subjects: inflatedSubject})
  })

  return inflatedQuestions
}

function getSubjects(questions) {
  return questions
    .reduce((prev, question) => prev.concat(question.subjectIds), [])
}

async function getProjectInfoByIds(projectIds = []) {
  const projects = await Project.getAll(...projectIds)
  return projects.reduce((result, next) => ({...result, [next.id]: {id: next.id, handle: next.name, name: next.name}}), {})
}

async function getMemberInfoByIds(memberIds) {
  const members = await getMemberInfo(memberIds)
  return members.reduce((result, member) => {
    result[member.id] = member
    return result
  }, {})
}
