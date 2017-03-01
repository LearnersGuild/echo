import {connect} from 'src/db'
import {getOwnerAndRepoFromGitHubURL} from 'src/common/util'
import {getTeam, createTeam} from 'src/server/services/gitHubService'

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

async function createGitHubTeamWithAccessToGoalRepo(chapter) {
  const {owner, repo} = getOwnerAndRepoFromGitHubURL(chapter.goalRepositoryURL)

  const team = await getTeam(owner, chapter.channelName)
  if (team) {
    console.log(`Found GitHub team ${owner}/${chapter.channelName}`)
    return team
  }

  console.log(`Creating GitHub team ${owner}/${chapter.channelName}`)
  return await createTeam(chapter.channelName, chapter.name, owner, {
    repoNames: [repo],
    permission: 'push',
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
