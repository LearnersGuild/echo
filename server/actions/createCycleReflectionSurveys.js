import {saveSurvey} from '../../server/db/survey'
import {PROJECT_REVIEW_DESCRIPTOR, RETROSPECTIVE_DESCRIPTOR} from '../../common/models/surveyBlueprint'
import {getActiveQuestionsByIds} from '../../server/db/question'
import {
  getTeamPlayerIds,
  getProjectsForChapterInCycle,
  getProjectHistoryForCycle,
  setProjectReviewSurveyForCycle,
  setRetrospectiveSurveyForCycle,
} from '../../server/db/project'
import {getSurveyBlueprintByDescriptor} from '../../server/db/surveyBlueprint'

export default function createCycleReflectionSurveys(cycle) {
  return Promise.all([
    createRetrospectiveSurveys(cycle),
    createProjectReviewSurveys(cycle),
  ])
}

export function createProjectReviewSurveys(cycle) {
  return getProjectsForChapterInCycle(cycle.chapterId, cycle.id)
    .then(projects => Promise.all(
      projects.map(project => buildSurvey(project, cycle.id, PROJECT_REVIEW_DESCRIPTOR)
        .then(surveyId => setProjectReviewSurveyForCycle(project.id, cycle.id, surveyId))
    )))
}

export function createRetrospectiveSurveys(cycle) {
  return getProjectsForChapterInCycle(cycle.chapterId, cycle.id)
    .then(projects => Promise.all(
      projects.map(project => buildSurvey(project, cycle.id, RETROSPECTIVE_DESCRIPTOR)
        .then(surveyId => setRetrospectiveSurveyForCycle(project.id, cycle.id, surveyId))
    )))
}

async function buildSurvey(project, cycleId, surveyDescriptor) {
  if (await projectSurveyExists(project, cycleId, surveyDescriptor)) {
    throw new Error(`${surveyDescriptor} survey already exists for project ${project.name} cycle ${cycleId}.`)
  }

  return await buildSurveyQuestionRefs(project, cycleId, surveyDescriptor)
    .then(questionRefs => saveSurvey({
      questionRefs,
      completedBy: [],
    }))
    .then(result => result.generated_keys[0])
}

function projectSurveyExists(project, cycleId, surveyDescriptor) {
  return Boolean(getProjectHistoryForCycle(project, cycleId)[`${surveyDescriptor}SurveyId`])
}

function buildSurveyQuestionRefs(project, cycleId, surveyDescriptor) {
  return getSurveyBlueprintByDescriptor(surveyDescriptor)
    .then(surveyBlueprint => {
      const questionRefDefaults = surveyBlueprint.defaultQuestionRefs
      if (!questionRefDefaults || !questionRefDefaults.length) {
        throw new Error(`No ${surveyDescriptor} questions found!`)
      }

      const getOffset = id => questionRefDefaults.findIndex(ref => ref.questionId === id)
      const questionRefDefaultsById = questionRefDefaults
        .reduce((obj, next) => Object.assign({}, obj, {[next.questionId]: next}), {})

      return getActiveQuestionsByIds(questionRefDefaults.map(({questionId}) => questionId))
        .then(questions => questions.sort((a, b) => getOffset(a.id) - getOffset(b.id)))
        .then(questions =>
          mapQuestionsToQuestionRefs(questions, project, cycleId, questionRefDefaultsById, surveyDescriptor)
        )
    })
}

const questionRefBuilders = {
  [PROJECT_REVIEW_DESCRIPTOR]: (question, project /* , cycleId */) => {
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

  [RETROSPECTIVE_DESCRIPTOR]: (question, project, cycleId) => {
    const teamPlayerIds = getTeamPlayerIds(project, cycleId)

    switch (question.subjectType) {
      case 'team':
        return [{
          questionId: question.id,
          subjectIds: teamPlayerIds,
        }]

      case 'player':
        return teamPlayerIds.map(playerId => ({
          questionId: question.id,
          subjectIds: [playerId],
        }))

      default:
        throw new Error(`Unsupported default retrospective survey question type: ${question.subjectType} for question ${question.id}`)
    }
  },
}

function mapQuestionsToQuestionRefs(questions, project, cycleId, questionRefDefaultsById, surveyDescriptor) {
  const mapQuestionToQuestionRefs = questionRefBuilders[surveyDescriptor]
  return questions
    .map(question => mapQuestionToQuestionRefs(question, project, cycleId)
      .map(ref => Object.assign({}, ref, questionRefDefaultsById[question.id]))
    )
    .reduce((a, b) => a.concat(b), [])
}

