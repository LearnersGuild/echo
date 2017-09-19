import Promise from 'bluebird'

import {QUESTION_RESPONSE_TYPES, QUESTION_SUBJECT_TYPES} from 'src/common/models/survey'
import RETROSPECTIVE_DESCRIPTOR from 'src/common/models/surveyBlueprint'
import {r, Phase, Project, Question, Survey, getSurveyBlueprintByDescriptor} from 'src/server/services/dataService'
import {LGBadRequestError} from 'src/server/util/error'

export default function ensureCycleReflectionSurveysExist(cycle) {
  return ensureRetrospectiveSurveysExist(cycle)
}

export async function ensureRetrospectiveSurveysExist(cycle) {
  const retroPhases = await Phase.filter({hasRetrospective: true}).pluck('id')
  const retroPhaseIds = r.expr(retroPhases.map(p => p.id))
  const retroProjects = await Project
    .filter({chapterId: cycle.chapterId, cycleId: cycle.id})
    .filter(project => r.and(
      project.hasFields('retrospectiveSurveyId').not(),
      retroPhaseIds.contains(project('phaseId'))
    ))

  return Promise.map(retroProjects, async project => {
    const retrospectiveSurveyId = await buildSurvey(project, RETROSPECTIVE_DESCRIPTOR)
    return Project.get(project.id).updateWithTimestamp({retrospectiveSurveyId})
  })
}

async function buildSurvey(project, surveyDescriptor) {
  if (projectSurveyExists(project, surveyDescriptor)) {
    throw new LGBadRequestError(`${surveyDescriptor} survey already exists for project ${project.name}.`)
  }

  const questionRefs = await buildSurveyQuestionRefs(project, surveyDescriptor)
  const newSurvey = await Survey.save({questionRefs})
  return newSurvey.id
}

function projectSurveyExists(project, surveyDescriptor) {
  return Boolean(project[`${surveyDescriptor}SurveyId`])
}

async function buildSurveyQuestionRefs(project, surveyDescriptor) {
  const surveyBlueprint = await getSurveyBlueprintByDescriptor(surveyDescriptor)
  const questionRefDefaults = surveyBlueprint.defaultQuestionRefs
  if (!questionRefDefaults || questionRefDefaults.length === 0) {
    throw new Error(`No ${surveyDescriptor} questions found!`)
  }

  const getOffset = id => questionRefDefaults.findIndex(ref => ref.questionId === id)
  const sortQuestions = (a, b) => getOffset(a.id) - getOffset(b.id)

  const questionRefDefaultsById = questionRefDefaults
    .reduce((obj, next) => Object.assign({}, obj, {[next.questionId]: next}), {})

  const questionIds = questionRefDefaults.map(({questionId}) => questionId)
  const activeQuestions = await Question.getAll(...questionIds).filter({active: true})
  const applicableQuestions = filterProjectSurveyQuestions(project, activeQuestions).sort(sortQuestions)
  return mapQuestionsToQuestionRefs(applicableQuestions, project, questionRefDefaultsById, surveyDescriptor)
}

const questionRefBuilders = {
  [RETROSPECTIVE_DESCRIPTOR]: (question, project) => {
    const {memberIds} = project

    switch (question.subjectType) {
      case QUESTION_SUBJECT_TYPES.TEAM:
        return [{
          questionId: question.id,
          subjectIds: memberIds,
        }]

      case QUESTION_SUBJECT_TYPES.MEMBER:
        return memberIds.map(memberId => ({
          questionId: question.id,
          subjectIds: [memberId],
        }))

      case QUESTION_SUBJECT_TYPES.PROJECT:
        return [{
          questionId: question.id,
          subjectIds: [project.id],
        }]

      default:
        throw new Error(`Unsupported default retrospective survey question type: ${question.subjectType} for question ${question.id}`)
    }
  },
}

function mapQuestionsToQuestionRefs(questions, project, questionRefDefaultsById, surveyDescriptor) {
  const mapQuestionToQuestionRefs = questionRefBuilders[surveyDescriptor]
  return questions
    .map(question => mapQuestionToQuestionRefs(question, project)
      .map(ref => Object.assign({}, ref, questionRefDefaultsById[question.id]))
    )
    .reduce((a, b) => a.concat(b), [])
}

function filterProjectSurveyQuestions(project, questions) {
  const isSinglePersonTeam = project.memberIds.length === 1
  return isSinglePersonTeam ?
    questions.filter(question => !(isSinglePersonTeam && question.responseType === QUESTION_RESPONSE_TYPES.RELATIVE_CONTRIBUTION)) :
    questions
}
