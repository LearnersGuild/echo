import {Project, Survey} from 'src/server/services/dataService'


async function unlockRetroSurveyForUser({playerId, projectId}) {
  const project = await Project.get(projectId)
  const survey = await project.surveyModel()

  survey.removeRelation(createdAt[projectId])
  await survey.save()
}
