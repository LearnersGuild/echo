import {LGCLICommandNotFoundError} from 'src/server/util/error'

export function getCommand(command) {
  let commandSpec
  let commandImpl
  try {
    commandSpec = require('@learnersguild/game-cli')[command]
    commandImpl = require(`src/server/cliCommand/commands/${command}`)
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      throw err
    }
    throw new LGCLICommandNotFoundError(command)
  }
  return {commandSpec, commandImpl}
}

export function parseCommand(commandBody) {
  const {
    command,
    text,
    token,
    /* eslint-disable camelcase */
    response_url: responseURL,
    user_name: handle,
    /* eslint-enable camelcase */
  } = commandBody

  const commandName = command.replace(/^\//, '')
  return {
    command: commandName,
    argv: _tokenizeCommandString(text),
    token,
    responseURL,
    handle,
    commandBody,
  }
}

export const GUILD_COLORS = {
  WARNING: '#F2BB1A',
  ERROR: '#ED3F60',
  SUCCESS: '#97C93D',
  INFO: '#00A3DF',
}
export function deprecatedCommand(command, url) {
  return {
    text: `Go here instead: ${url}`,
    attachments: [{
      color: GUILD_COLORS.WARNING,
      text: `The \`${command}\` command has been deprecated.`,
      mrkdwn_in: ['text'], // eslint-disable-line camelcase
    }],
  }
}

const SPACE = ' '.charCodeAt(0)
const DOUBLE_QUOTE = '"'.charCodeAt(0)
const SINGLE_QUOTE = "'".charCodeAt(0)

export function _tokenizeCommandString(commandStr) {
  const argv = []
  for (let i = 0, endPos = 0; i < commandStr.length; ++i) {
    if (commandStr.charCodeAt(i) === SPACE) {
      continue
    } else if (commandStr.charCodeAt(i) === SINGLE_QUOTE) {
      endPos = _indexOfQuotedStringEnd(commandStr, ++i, commandStr.length, {quote: "'"})
    } else if (commandStr.charCodeAt(i) === DOUBLE_QUOTE) {
      endPos = _indexOfQuotedStringEnd(commandStr, ++i, commandStr.length, {quote: '"'})
    } else {
      endPos = _indexOfWordEnd(commandStr, i, commandStr.length)
    }
    let arg = commandStr.slice(i, endPos).replace(/\\(.)/g, '$1')
    // assume that emdash (—) preceding an argument was meant to be two hyphens (--)
    arg = arg.replace(/^—(\S)/, '--$1')
    argv.push(arg)

    i = endPos
  }

  return argv
}

function _indexOfQuotedStringEnd(chars, pos, len, opts) {
  const options = Object.assign({escape: '\\', quote: '"'}, opts)
  const ESCAPE = options.escape.charCodeAt(0)
  const QUOTE = options.quote.charCodeAt(0)
  let escaping = false
  for (let i = pos; i < len; ++i) {
    if (!escaping) {
      if (chars.charCodeAt(i) === ESCAPE) {
        escaping = true
      } else if (chars.charCodeAt(i) === QUOTE) {
        return i
      }
    } else {
      escaping = false
    }
  }
  throw new Error(`unmatched quote: ${options.quote}`)
}

function _indexOfWordEnd(chars, pos, len, opts) {
  const options = Object.assign({escape: '\\'}, opts)
  const ESCAPE = options.escape.charCodeAt(0)
  let escaping = false
  for (let i = pos; i <= len; ++i) {
    if (!escaping) {
      if (chars.charCodeAt(i) === ESCAPE) {
        escaping = true
      } else if (chars.charCodeAt(i) === SPACE) {
        return i
      }
    } else {
      escaping = false
    }
  }
  return len
}
