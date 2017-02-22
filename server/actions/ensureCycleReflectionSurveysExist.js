import Promise from 'bluebird'

import {saveSurvey} from 'src/server/db/survey'
import {PROJECT_REVIEW_DESCRIPTOR, RETROSPECTIVE_DESCRIPTOR} from 'src/common/models/surveyBlueprint'
import {getActiveQuestionsByIds} from 'src/server/db/question'
import {getSurveyBlueprintByDescriptor} from 'src/server/db/surveyBlueprint'
import {findProjects, updateProject} from 'src/server/db/project'

export default function ensureCycleReflectionSurveysExist(cycle) {
  return Promise.all([
    ensureRetrospectiveSurveysExist(cycle),
    ensureProjectReviewSurveysExist(cycle),
  ])
}

export async function ensureProjectReviewSurveysExist(cycle) {
  const projects = await findProjects({chapterId: cycle.chapterId, cycleId: cycle.id})
    .filter(project => project.hasFields('projectReviewSurveyId').not())
  return Promise.map(projects, async project => {
    const projectReviewSurveyId = await buildSurvey(project, PROJECT_REVIEW_DESCRIPTOR)
    return updateProject({id: project.id, projectReviewSurveyId})
  })
}

export function ensureRetrospectiveSurveysExist(cycle) {
  const projects = findProjects({chapterId: cycle.chapterId, cycleId: cycle.id})
    .filter(project => project.hasFields('retrospectiveSurveyId').not())
  return Promise.map(projects, async project => {
    const retrospectiveSurveyId = await buildSurvey(project, RETROSPECTIVE_DESCRIPTOR)
    return updateProject({id: project.id, retrospectiveSurveyId})
  })
}

async function buildSurvey(project, surveyDescriptor) {
  if (projectSurveyExists(project, surveyDescriptor)) {
    throw new Error(`${surveyDescriptor} survey already exists for project ${project.name}.`)
  }

  return await buildSurveyQuestionRefs(project, surveyDescriptor)
    .then(questionRefs => saveSurvey({
      questionRefs,
      completedBy: [],
      unlockedFor: [],
    }))
    .then(result => result.generated_keys[0])
}

function projectSurveyExists(project, surveyDescriptor) {
  return Boolean(project[`${surveyDescriptor}SurveyId`])
}

function buildSurveyQuestionRefs(project, surveyDescriptor) {
  const selectApplicableQuestions = questions => (
    project.playerIds.length !== 1 ?
      questions :
      questions.filter(question => question.responseType !== 'relativeContribution')
  )

  return getSurveyBlueprintByDescriptor(surveyDescriptor)
    .then(surveyBlueprint => {
      const questionRefDefaults = surveyBlueprint.defaultQuestionRefs
      if (!questionRefDefaults || questionRefDefaults.length === 0) {
        throw new Error(`No ${surveyDescriptor} questions found!`)
      }

      const getOffset = id => questionRefDefaults.findIndex(ref => ref.questionId === id)
      const questionRefDefaultsById = questionRefDefaults
        .reduce((obj, next) => Object.assign({}, obj, {[next.questionId]: next}), {})

      return getActiveQuestionsByIds(questionRefDefaults.map(({questionId}) => questionId))
        .then(selectApplicableQuestions)
        .then(questions => questions.sort((a, b) => getOffset(a.id) - getOffset(b.id)))
        .then(questions =>
          mapQuestionsToQuestionRefs(questions, project, questionRefDefaultsById, surveyDescriptor)
        )
    })
}

const questionRefBuilders = {
  [PROJECT_REVIEW_DESCRIPTOR]: (question, project) => {
    switch (question.subjectType) {
      case 'project':
        return [{
          questionId: question.id,
          subjectIds: [project.id],
        }]

      default:
        throw new Error(`Unsupported default project review survey question type: ${question.subjectType} for question ${question.id}`)
    }
  },

  [RETROSPECTIVE_DESCRIPTOR]: (question, project) => {
    const {playerIds} = project

    switch (question.subjectType) {
      case 'team':
        return [{
          questionId: question.id,
          subjectIds: playerIds,
        }]

      case 'player':
        return playerIds.map(playerId => ({
          questionId: question.id,
          subjectIds: [playerId],
        }))

      case 'project':
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
