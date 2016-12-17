import faker from 'faker'
import fetch from 'isomorphic-fetch'

import config from 'src/config'
import {getOwnerAndRepoFromGitHubURL} from 'src/common/util'

function generateGoal() {
  const title = faker.lorem.words()
  const objectives = Array.from(Array(faker.random.number({min: 3, max: 7})).keys())
    .map(() => `- [ ] ${faker.lorem.sentence()}`)
  const body = `# ${title}

## Description

${faker.lorem.paragraphs(2, '\n\n')}

## Context

${faker.lorem.paragraphs(2, '\n\n')}

## Objectives

${objectives.join('\n')}`

  return {
    title,
    body,
  }
}

function postIssue(owner, repo, issue) {
  const fetchOpts = {
    method: 'POST',
    headers: {
      Authorization: `token ${config.server.github.tokens.admin}`,
      Accept: 'application/json',
    },
    body: JSON.stringify(issue),
  }
  return fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, fetchOpts)
    .then(resp => {
      if (!resp.ok) {
        console.error(JSON.parse(resp.body.read().toString()))
        throw new Error(resp.statusText)
      }
      return resp.json()
    })
}

function generate() {
  if (!config.server.github.repos.crafts || !config.server.github.tokens.admin) {
    throw new Error('Github crafts repo and admin token not configured')
  }

  const {owner, repo} = getOwnerAndRepoFromGitHubURL(config.server.github.repos.crafts)

  const numGoals = 50
  const ghPromises = Array.from(Array(numGoals).keys()).map(() => postIssue(owner, repo, generateGoal()))
  Promise.all(ghPromises)
    .then(() => console.log(`Created ${numGoals} goal issues in ${config.server.github.repos.crafts}`))
    .catch(err => console.error(err.stack))
}

export default generate

if (!module.parent) {
  generate()
}
