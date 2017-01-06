import 'babel-polyfill' // eslint-disable-line import/no-unassigned-import
import jsdom from 'jsdom'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinonChai from 'sinon-chai'

// jsdom setup
const doc = jsdom.jsdom('<!doctype html><html><body></body></html>')
const win = doc.defaultView

global.__CLIENT__ = false
global.__SERVER__ = true
global.document = doc
global.window = win
global.navigator = win.navigator
global.getComputedStyle = win.getComputedStyle

// helpers
global.testContext = filename => {
  return filename.slice(1).split('/').reduce((ret, curr) => {
    const currWithoutTests = curr === '__tests__' ? null : `/${curr}`
    const value = ret.useCurr && currWithoutTests ? `${ret.value}${currWithoutTests}` : ret.value
    const useCurr = ret.useCurr || curr === 'game'
    return {useCurr, value}
  }, {useCurr: false, value: ''}).value.replace('.test.js', '').slice(1)
}

// setup chai and make it available in all tests
chai.use(chaiAsPromised)
chai.use(sinonChai)
global.expect = chai.expect

// CSS modules setup
require('src/server/configureCSSModules')()
