
import {QUESTION_SUBJECT_TYPES} from 'src/common/models/survey'
import {WORK_PLAN_DESCRIPTOR} from 'src/common/models/surveyBlueprint'
import {Project, Question, Survey, getSurveyBlueprintByDescriptor} from 'src/server/services/dataService'
import {LGBadRequestError} from 'src/server/util/error'

// create a survey and add that survey's id to the project in the database
export default async function ensureWorkPlanSurveyExists(project) {
  const projectId = project && project.id ? project.id : project
  if (!projectId) {
    throw new LGBadRequestError('Must provide valid project input')
  }
  const projectCopy = await Project.get(projectId)
  const workPlanSurveyId = await buildSurvey(projectCopy, WORK_PLAN_DESCRIPTOR)
  await Project.get(projectCopy.id).updateWithTimestamp({workPlanSurveyId})
  return workPlanSurveyId
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

// the buildSurveyQuestionRefs function is a lot of code we don't need yet, because it's designed for multiple questions and the workPlan survey only has one. However, the logic was already written (for the retro survey), so I'll include it so that the workPlan survey is easily extended
async function buildSurveyQuestionRefs(project, surveyDescriptor) {
  const surveyBlueprint = await getSurveyBlueprintByDescriptor(surveyDescriptor)
  const questionRefDefaults = surveyBlueprint.defaultQuestionRefs
  if (!questionRefDefaults || questionRefDefaults.length === 0) {
    throw new Error(`No ${surveyDescriptor} questions found!`)
  }

  const questionRefDefaultsById = questionRefDefaults.reduce((obj, next) => Object.assign({}, obj, {[next.questionId]: next}), {})

  const questionIds = questionRefDefaults.map(({questionId}) => questionId)
  const activeQuestions = await Question.getAll(...questionIds).filter({active: true})
  return mapQuestionsToQuestionRefs(activeQuestions, project, questionRefDefaultsById, surveyDescriptor)
}

const questionRefBuilders = {
  [WORK_PLAN_DESCRIPTOR]: (question, project) => {
    const {memberIds} = project

    switch (question.subjectType) {
      case QUESTION_SUBJECT_TYPES.PROJECT:
        return [{
          questionId: question.id,
          subjectIds: memberIds,
        }]

      default:
        throw new Error(`Unsupported default work plan survey question type: ${question.subjectType} for question ${question.id}`)
    }
  }
}

// similar to buildSurveyQuestionRefs above, this function is set up for many questions
function mapQuestionsToQuestionRefs(questions, project, questionRefDefaultsById, surveyDescriptor) {
  const mapQuestionToQuestionRefs = questionRefBuilders[surveyDescriptor]
  return questions
    .map(question => mapQuestionToQuestionRefs(question, project)
      .map(ref => Object.assign({}, ref, questionRefDefaultsById[question.id]))
    )
    .reduce((a, b) => a.concat(b), [])
}
