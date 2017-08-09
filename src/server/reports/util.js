import csvWriter from 'csv-write-stream'

import {Chapter, Cycle} from 'src/server/services/dataService'

export async function getCycleId(chapterId, cycleNumber) {
  const cycles = await Cycle.filter({chapterId, cycleNumber})
  if (cycles.length === 0) {
    throw new Error(`Unable to find a cycle with cycleNumber ${cycleNumber}`)
  }
  return cycles[0].id
}

export async function getChapterId(chapterName) {
  const chapters = Chapter.filter({name: chapterName})
  if (chapters.length === 0) {
    throw new Error(`Unable to find a chapter named ${chapterName}`)
  }
  return chapters[0].id
}

export function getLatestCycleInChapter(chapterId) {
  return Cycle
    .filter({chapterId})
    .max('cycleNumber')('cycleNumber')
    .execute()
}

export function writeCSV(rows, outStream, opts) {
  const writer = csvWriter(opts || {})
  writer.pipe(outStream)
  rows.forEach(row => writer.write(row))
  writer.end()
}

export function shortenedMemberId(rethinkDBid) {
  return rethinkDBid.split('-')(0)
}

export function parseCycleReportArgs(args) {
  const requiredArgs = ['cycleNumber']

  requiredArgs.forEach(arg => {
    if (!args[arg]) {
      throw new Error(`${arg} is a required parameter`)
    }
  })

  if (!args.chapterName && !args.chapterId) {
    throw new Error('Must provide chapterName or chapterId')
  }

  return {
    ...args,
    cycleNumber: parseInt(args.cycleNumber, 10),
  }
}
