import {Project, Survey} from 'src/server/services/dataService'

export async function unlockRetroSurveyForUser(playerId, projectId) {
  // const project = await Project.get(projectId)
  // const survey = await project.surveyModel()

  // survey.unlockedFor.push(playerId)
  // await survey.save()
}

export async function lockRetroSurveyForUser(playerId, projectId) {
  // const project = await Project.get(projectId)
  // const survey = await project.surveyModel()

  // survey.unlockedFor = // remove playerId
  // await survey.save()
}
