// start workers
require('./chapterCreated').start()
require('./chatMessageSent').start()
require('./cycleCompleted').start()
require('./cycleInitialized').start()
require('./cycleReflectionStarted').start()
// require('./memberPhaseChanged').start()
require('./projectCreated').start()
require('./surveySubmitted').start()
require('./userInviteCodeUsed').start()
require('./voteSubmitted').start()

// start change feed listeners
require('src/server/configureChangeFeeds')()

// Refresh the cache on startup
require('src/server/services/chatService').refreshCache()

// file watch & reload
require('src/server/configureWatcher')()
