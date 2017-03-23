import {apiFetchRaw, APIError} from 'src/server/util/api'
import config from 'src/config'

export default function getGoalInfo(goalNumber) {
  const goalURL = `${config.server.goalLibrary.baseURL}/api/goals/${goalNumber}.json`
  return apiFetchRaw(goalURL)
    .then(resp => {
      if (!resp.ok) {
        // if no issue is found at the given URL, return null
        if (resp.status === 404) {
          return null
        }
        throw new APIError(resp.status, resp.statusText, goalURL)
      }
      return resp.json().then(goalData => {
        goalData.url = goalURL
        return goalData
      })
    })
}
