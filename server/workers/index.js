// start workers
require('./chapterCreated').start()
require('./chatMessageSent').start()
require('./cycleCompleted').start()
require('./cycleInitialized').start()
require('./cycleReflectionStarted').start()
require('./projectCreated').start()
require('./surveySubmitted').start()
require('./userCreated').start()
require('./voteSubmitted').start()
require('./memberPhaseChanged').start()

// start change feed listeners
require('src/server/configureChangeFeeds')()
