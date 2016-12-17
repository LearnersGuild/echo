import moment from 'moment-timezone'

const DIFF_UNITS = 'minutes'

export function finish(error, options) {
  /* eslint-disable unicorn/no-process-exit */
  if (error) {
    console.log('Script error', error)
    console.log(error.stack)
    _logProcessingTime(options)
    process.exit(1)
  } else {
    _logProcessingTime(options)
    console.log('Script complete')
    process.exit(0)
  }
}

function _logProcessingTime(options) {
  const {startedAt} = options || {}
  if (startedAt) {
    const endedAt = moment()
    const diff = endedAt.diff(moment(startedAt), DIFF_UNITS)
    console.log(`Processing time: ${diff} ${DIFF_UNITS}`)
  }
}
