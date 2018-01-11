import {combineReducers} from 'redux'

import {routerReducer} from 'react-router-redux'
import {reducer as formReducer} from 'redux-form'

import app from './app'
import auth from './auth'
import chapters from './chapters'
import phases from './phases'
import phaseSummaries from './phaseSummaries'
import members from './members'
import projects from './projects'
import projectSummaries from './projectSummaries'
import users from './users'
import userSummaries from './userSummaries'
import surveys from './surveys'

const rootReducer = combineReducers({
  routing: routerReducer,
  form: formReducer,
  app,
  auth,
  chapters,
  phases,
  phaseSummaries,
  members,
  projects,
  projectSummaries,
  users,
  userSummaries,
  surveys,
})

export default rootReducer
