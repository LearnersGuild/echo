import bluebird from 'bluebird'
import factoryGirl from 'factory-girl'

import chapterFactoryDefine from './chapter'
import playerFactoryDefine from './player'
import moderatorFactoryDefine from './moderator'
import userFactoryDefine from './user'
import cycleFactoryDefine from './cycle'
import voteFactoryDefine from './vote'
import projectFactoryDefine from './project'
import surveyFactoryDefine from './survey'
import surveyBlueprintFactoryDefine from './surveyBlueprint'
import poolFactoryDefine from './pool'
import statFactoryDefine from './stat'
import questionFactoryDefine from './question'
import responseFactoryDefine from './response'
import playerGoalRankFactoryDefine from './playerGoalRank'
import RethinkDBAdapter from './rethinkdb-adapter'

const factory = factoryGirl.promisify(bluebird)
factory.setAdapter(new RethinkDBAdapter())

chapterFactoryDefine(factory)
playerFactoryDefine(factory)
moderatorFactoryDefine(factory)
userFactoryDefine(factory)
cycleFactoryDefine(factory)
voteFactoryDefine(factory)
projectFactoryDefine(factory)
surveyFactoryDefine(factory)
surveyBlueprintFactoryDefine(factory)
poolFactoryDefine(factory)
statFactoryDefine(factory)
questionFactoryDefine(factory)
responseFactoryDefine(factory)
playerGoalRankFactoryDefine(factory)

export default factory
