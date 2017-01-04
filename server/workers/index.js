global.__CLIENT__ = false
global.__SERVER__ = true

// start workers
require('./newGameUser').start()
require('./newChapter').start()
require('./newOrUpdatedVote').start()
require('./cycleInitialized').start()
require('./cycleReflectionStarted').start()
require('./cycleCompleted').start()
require('./projectArtifactChanged').start()
require('./surveyResponseSubmitted').start()
require('./sendChatMessage').start()

// start change feed listeners
require('src/server/configureChangeFeeds')()
