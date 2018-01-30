import bluebird from 'bluebird'
import factoryGirl from 'factory-girl'

import chapterFactoryDefine from './chapter'
import memberFactoryDefine from './member'
import userFactoryDefine from './user'
import cycleFactoryDefine from './cycle'
import projectFactoryDefine from './project'
import surveyFactoryDefine from './survey'
import surveyBlueprintFactoryDefine from './surveyBlueprint'
import questionFactoryDefine from './question'
import responseFactoryDefine from './response'
import phaseFactoryDefine from './phase'
import feedbackTypeFactoryDefine from './feedbackType'
import RethinkDBAdapter from './RethinkDBAdapter'

const factory = factoryGirl.promisify(bluebird)
factory.setAdapter(new RethinkDBAdapter())

chapterFactoryDefine(factory)
memberFactoryDefine(factory)
userFactoryDefine(factory)
cycleFactoryDefine(factory)
projectFactoryDefine(factory)
surveyFactoryDefine(factory)
surveyBlueprintFactoryDefine(factory)
questionFactoryDefine(factory)
responseFactoryDefine(factory)
phaseFactoryDefine(factory)
feedbackTypeFactoryDefine(factory)

export default factory
