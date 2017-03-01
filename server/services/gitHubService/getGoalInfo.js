import url from 'url'

import {apiURL, apiFetchRaw, APIError} from './util'

const TEAM_SIZE_LABEL_PREFIX = 'team-size-'

export default function getGoalInfo(goalRepositoryURL, goalDescriptor) {
  const issueURL = _githubIssueURL(goalRepositoryURL, goalDescriptor)
  if (!issueURL) {
    return Promise.resolve(null)
  }

  return apiFetchRaw(issueURL)
    .then(resp => {
      if (!resp.ok) {
        // if no issue is found at the given URL, return null
        if (resp.status === 404) {
          return null
        }
        throw new APIError(resp.status, resp.statusText, issueURL)
      }
      return resp.json()
    })
    // if no issue is found at the given URL, return null
    .then(githubIssue => (
      githubIssue ? {
        url: githubIssue.html_url,
        title: githubIssue.title,
        teamSize: _getTeamSizeFromLabels((githubIssue.labels || []).map(label => label.name)),
        githubIssue,
      } : null
    ))
}

function _githubIssueURL(goalRepositoryURL, goalDescriptor) {
  goalDescriptor = String(goalDescriptor)
  const goalRepositoryURLParts = url.parse(goalRepositoryURL)
  const goalURLParts = url.parse(goalDescriptor)
  if (goalURLParts.protocol) {
    // see: http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
    const escapedGoalRepositoryURL = goalRepositoryURL.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')
    const issueURLRegex = new RegExp(`^${escapedGoalRepositoryURL}/issues/\\d+$`)
    if (goalDescriptor.match(issueURLRegex)) {
      return apiURL(`/repos${goalURLParts.path}`)
    }
  } else if (goalDescriptor.match(/^\d+$/)) {
    return apiURL(`/repos${goalRepositoryURLParts.path}/issues/${goalDescriptor}`)
  }
}

function _getTeamSizeFromLabels(labels) {
  const teamSizeLabel = (labels || []).find(label => (label || '').toLowerCase().startsWith(TEAM_SIZE_LABEL_PREFIX))
  return teamSizeLabel ? parseInt(teamSizeLabel.split(TEAM_SIZE_LABEL_PREFIX)[1], 10) : null
}
