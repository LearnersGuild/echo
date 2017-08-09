import {combineReducers} from 'redux'

import {routerReducer} from 'react-router-redux'
import {reducer as formReducer} from 'redux-form'

import app from './app'
import auth from './auth'
import chapters from './chapters'
import cycles from './cycles'
import cycleVotingResults from './cycleVotingResults'
import phases from './phases'
import phaseSummaries from './phaseSummaries'
import members from './members'
import memberSummaries from './memberSummaries'
import projects from './projects'
import projectSummaries from './projectSummaries'
import surveys from './surveys'

const rootReducer = combineReducers({
  routing: routerReducer,
  form: formReducer,
  app,
  auth,
  chapters,
  cycles,
  cycleVotingResults,
  phases,
  phaseSummaries,
  members,
  memberSummaries,
  projects,
  projectSummaries,
  surveys,
})

export default rootReducer
