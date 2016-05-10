global.__CLIENT__ = false
global.__SERVER__ = true
global.__DEVELOPMENT__ = process.env.NODE_ENV === 'development'

/* global __DEVELOPMENT__ */
if (__DEVELOPMENT__) {
  require('dotenv').load()
}

require('./newPlayer').start()
require('./newChapter').start()
require('./newOrUpdatedVote').start()
