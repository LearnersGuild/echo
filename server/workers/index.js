global.__CLIENT__ = false
global.__SERVER__ = true

require('./newGameUser').start()
require('./newChapter').start()
require('./newOrUpdatedVote').start()
require('./cycleInitialized').start()
require('./cycleReflectionStarted').start()
require('./cycleCompleted').start()
require('./projectArtifactChanged').start()
require('./surveyResponseSubmitted').start()
