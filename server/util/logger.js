/* eslint-disable no-nested-ternary, no-multi-spaces, comma-spacing */
/* eslint key-spacing: [2, { "mode": "minimum" }] */

const [ERROR, LOG, DEBUG, TRACE] = [1, 2, 3, 4]
const LOG_LEVEL = process.env.NODE_ENV === 'development' ? DEBUG :
                  process.env.NODE_ENV === 'test'        ? ERROR :
                  LOG

export default {
  error: (...args) => should(ERROR) && console.log('ERROR>', ...args),
  log:   (...args) => should(LOG)   && console.log('LOG>'  , ...args),
  debug: (...args) => should(DEBUG) && console.log('DEBUG>', ...args),
  trace: (...args) => should(TRACE) && console.log('TRACE>', ...args),
}

function should(lvl) {
  return LOG_LEVEL >= lvl
}
