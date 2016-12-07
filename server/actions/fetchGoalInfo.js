import url from 'url'
import fetch from 'isomorphic-fetch'

import config from 'src/config'

const TEAM_SIZE_LABEL_PREFIX = 'team-size-'

export default function fetchGoalInfo(goalRepositoryURL, goalDescriptor) {
  const issueURL = githubIssueURL(goalRepositoryURL, goalDescriptor)
  if (!issueURL) {
    return Promise.resolve(null)
  }

  const fetchOptions = {
    headers: {
      Authorization: `token ${config.server.github.tokens.admin}`,
      Accept: 'application/json',
    },
  }

  return fetch(issueURL, fetchOptions)
    .then(resp => {
      if (!resp.ok) {
        // if no issue is found at the given URL, return null
        if (resp.status === 404) {
          return null
        }
        const respBody = resp.body.read()
        const errMessage = respBody ? JSON.parse(respBody.toString()) : `FAILED: ${issueURL}`
        console.error(errMessage)
        throw new Error(`${errMessage}\n${resp.statusText}`)
      }
      return resp.json()
    })
    // if no issue is found at the given URL, return null (notify user later)
    .then(githubIssue => (githubIssue ? {
      url: githubIssue.html_url,
      title: githubIssue.title,
      teamSize: _getTeamSizeFromLabels((githubIssue.labels || []).map(label => label.name)),
      githubIssue,
    } : null))
}

function githubIssueURL(goalRepositoryURL, goalDescriptor) {
  goalDescriptor = String(goalDescriptor)
  const goalRepositoryURLParts = url.parse(goalRepositoryURL)
  const goalURLParts = url.parse(goalDescriptor)
  if (goalURLParts.protocol) {
    // see: http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
    const escapedGoalRepositoryURL = goalRepositoryURL.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
    const issueURLRegex = new RegExp(`^${escapedGoalRepositoryURL}\/issues\/\\d+$`)
    if (goalDescriptor.match(issueURLRegex)) {
      return `https://api.github.com/repos${goalURLParts.path}`
    }
  } else if (goalDescriptor.match(/^\d+$/)) {
    return `https://api.github.com/repos${goalRepositoryURLParts.path}/issues/${goalDescriptor}`
  }
}

function _getTeamSizeFromLabels(labels) {
  const teamSizeLabel = (labels || []).find(label => (label || '').toLowerCase().startsWith(TEAM_SIZE_LABEL_PREFIX))
  return teamSizeLabel ? parseInt(teamSizeLabel.split(TEAM_SIZE_LABEL_PREFIX)[1], 10) : null
}
