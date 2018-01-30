export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('chapterCreated', processChapterCreated)
}

async function processChapterCreated(chapter) {
  await createChapterChannel(chapter)
}

async function createChapterChannel(chapter) {
  const initializeChannel = require('src/server/actions/initializeChannel') // used in require hook-based mocking

  console.log(`Creating chapter channel ${chapter.channelName}`)
  await initializeChannel(chapter.channelName, {topic: chapter.name, users: ['echo']})
}
