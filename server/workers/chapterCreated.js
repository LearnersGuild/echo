import fetch from 'isomorphic-fetch'
import parseLinkHeader from 'parse-link-header'

import config from 'src/config'
import {connect} from 'src/db'
import {getOwnerAndRepoFromGitHubURL} from 'src/common/util'

const r = connect()

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('chapterCreated', processChapterCreated)
}

async function processChapterCreated(chapter) {
  const team = await createGitHubTeamWithAccessToGoalRepo(chapter)
  await addTeamIdToChapter(chapter, team)
  await createChapterChannel(chapter)
}

function recursiveFetchAndSelect(url, select) {
  const fetchOpts = {
    method: 'GET',
    headers: {
      Authorization: `token ${config.server.github.tokens.admin}`,
      Accept: 'application/json',
    },
  }
  return fetch(url, fetchOpts)
    .then(resp => {
      if (!resp.ok) {
        const respBody = resp.body.read()
        const parsedResponse = respBody && JSON.parse(respBody.toString())
        const errMessage = parsedResponse ? parsedResponse : `FAILED: ${url}`
        console.error(errMessage)
        throw new Error(`${errMessage} (${resp.statusText})`)
      }
      return resp.json()
        .then(results => {
          const found = select(results)
          if (!found) {
            const {next} = parseLinkHeader(resp.headers.get('Link'))
            if (next) {
              return recursiveFetchAndSelect(next.url, select)
            }
            throw new Error('All pages exhausted before selecting matching result.')
          }
          return found
        })
    })
}

function getGitHubTeam(owner, name) {
  console.log(`Fetching GitHub team for ${owner}/${name}`)
  const getTeamsURL = `https://api.github.com/orgs/${owner}/teams`
  return recursiveFetchAndSelect(getTeamsURL, teams => teams.filter(team => team.name === name)[0])
}

const GITHUB_ALREADY_EXISTS_ERROR_CODE = 'already_exists'
function isTeamAlreadyExistsError(ghResponse) {
  return (
    ghResponse &&
    ghResponse.errors &&
    ghResponse.errors.reduce((shouldIgnore, currentError) => {
      return shouldIgnore && (currentError.code === GITHUB_ALREADY_EXISTS_ERROR_CODE)
    }, true)
  )
}

function createGitHubTeamWithAccessToGoalRepo(chapter) {
  const {owner, repo} = getOwnerAndRepoFromGitHubURL(chapter.goalRepositoryURL)
  const body = {
    name: chapter.channelName,
    description: chapter.name,
    /* eslint-disable camelcase */
    repo_names: [`${owner}/${repo}`],
    permission: 'push',
  }
  const fetchOpts = {
    method: 'POST',
    headers: {
      Authorization: `token ${config.server.github.tokens.admin}`,
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  }
  console.log(`Creating GitHub team ${owner}/${body.name}`)
  const createTeamURL = `https://api.github.com/orgs/${owner}/teams`
  return fetch(createTeamURL, fetchOpts)
    .then(resp => {
      if (!resp.ok) {
        const respBody = resp.body.read()
        const parsedResponse = respBody && JSON.parse(respBody.toString())
        if (!isTeamAlreadyExistsError(parsedResponse)) {
          const errMessage = parsedResponse ? parsedResponse : `FAILED: ${createTeamURL}`
          console.error(errMessage)
          throw new Error(`${errMessage} (${resp.statusText})`)
        }
        console.log(`GitHub team ${owner}/${body.name} already exists`)
        return getGitHubTeam(owner, body.name)
      }
      return resp.json()
    })
}

async function addTeamIdToChapter(chapter, team) {
  console.log(`Adding GitHub team id (${team.id}) to chapter (${chapter.id})`)
  const savedChapter = await r.table('chapters')
    .get(chapter.id)
    .update({githubTeamId: team.id}, {returnChanges: 'always'})
    .run()
  if (savedChapter.replaced) {
    return savedChapter.changes[0].new_val
  }
  throw new Error(`Unable to add GitHub team id (${team.id}) to chapter (${chapter.id})`)
}

async function createChapterChannel(chapter) {
  const {createChannel} = require('src/server/services/chatService')

  console.log(`Creating chapter channel ${chapter.channelName}`)
  await createChannel(chapter.channelName, ['echo'], `${chapter.name}`)
}
