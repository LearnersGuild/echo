import path from 'path'
import child from 'child_process'
import parseArgs from 'minimist'
import s3 from 's3'

import config from 'src/config'
import dbConfig from 'src/config/db'
import finish from './util'

const s3Client = s3.createClient({s3Options: config.server.aws.s3})

const STATE_OPTIONS = {
  GOAL_SELECTION: 'GOAL_SELECTION',
  GOAL_SELECTION_VOTES: 'GOAL_SELECTION_VOTES',
  PRACTICE: 'PRACTICE',
  REFLECTION: 'REFLECTION',
}

run()
  .then(() => finish())
  .catch(err => finish(err))

async function run() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot be run in production')
  }

  const {STATE} = _parseCLIArgs()
  const stateSuffix = STATE ? `_${STATE}` : ''
  const dbFileName = `${dbConfig.db}${stateSuffix}.tar`
  const outputPath = path.resolve(__dirname, `../tmp/${dbFileName}`)

  console.log(`Cloning db ${dbFileName} from S3...`)

  await _downloadDBCopy(outputPath, dbFileName)
  await _importDBCopy(outputPath)
}

function _downloadDBCopy(outputPath, dbFileName) {
  return new Promise((resolve, reject) => {
    const downloader = s3Client.downloadFile({
      localFile: outputPath,
      s3Params: {
        Bucket: process.env.S3_BUCKET,
        Key: `${process.env.S3_KEY_PREFIX}/${dbFileName}`,
      },
    })

    downloader
      .on('error', err => {
        console.error('Download error:', err)
        reject(err)
      })
      .on('end', () => resolve())
  })
}

function _importDBCopy(outputPath) {
  return new Promise((resolve, reject) => {
    const ls = child.spawn('rethinkdb', ['restore', outputPath])

    ls.stdout.on('data', data => {
      console.log(`stdout: ${data}`)
    })

    ls.stderr.on('data', err => {
      console.log(`stderr: ${err}`)
      reject(err)
    })

    ls.on('close', code => {
      console.log(`import exited with code ${code}`)
      resolve()
    })
  })
}

function _parseCLIArgs() {
  const args = parseArgs(process.argv.slice(2))
  const [STATE] = args._
  if (STATE && !STATE_OPTIONS[STATE]) {
    console.warn('Usage:')
    console.warn('  npm run db:copy')
    console.warn('  npm run db:copy -- STATE')
    throw new Error(`STATE must be one of: ${Object.keys(STATE_OPTIONS).join(', ')}`)
  }
  return {STATE}
}
