/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import {
  parseCommand,
  _tokenizeCommandString,
} from '../util'

describe(testContext(__filename), function () {
  describe('parseCommand', function () {
    beforeEach(function () {
      this.body1 = {
        command: '/cycle',
        text: 'init',
      }
      this.body2 = {
        command: '/cycle',
        text: 'init --hours=32',
      }
    })
    it('strips off the slash from the command name', function () {
      const parsed = parseCommand(this.body1)
      expect(parsed.command).to.eq('cycle')
    })

    it('has an argv with the shell-tokenized arguments', function () {
      const parsed = parseCommand(this.body2)
      expect(parsed.argv).to.deep.eq(['init', '--hours=32'])
    })
  })

  describe('_tokenizeCommandString', function () {
    it('handles double-quoted args', function () {
      const tokenized = _tokenizeCommandString('  1st 2nd "third has \\"quotes\\"" 4th  ')
      expect(tokenized).to.deep.eq(['1st', '2nd', 'third has "quotes"', '4th'])
    })

    it('handles single-quoted args', function () {
      const tokenized = _tokenizeCommandString("  1st 2nd 'here\\'s the 3rd' 4th  ")
      expect(tokenized).to.deep.eq(['1st', '2nd', 'here\'s the 3rd', '4th'])
    })

    it('handles escaped args', function () {
      const tokenized = _tokenizeCommandString('  1st 2nd this\\ is\\ 3rd 4th')
      expect(tokenized).to.deep.eq(['1st', '2nd', 'this is 3rd', '4th'])
    })

    it('converts emdash to double-hyphen', function () {
      const tokenized = _tokenizeCommandString('init —help')
      expect(tokenized).to.deep.eq(['init', '--help'])
    })
  })
})
