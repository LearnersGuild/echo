import {combineReducers} from 'redux'

import {routerReducer} from 'react-router-redux'
import {reducer as formReducer} from 'redux-form'

import {auth} from './auth'
import {chapters} from './chapters'
import {cycles} from './cycles'
import {cycleVotingResults} from './cycleVotingResults'
import {players} from './players'
import {surveys} from './surveys'
import {errors} from './errors'

const rootReducer = combineReducers({
  routing: routerReducer,
  form: formReducer,
  auth,
  chapters,
  cycles,
  cycleVotingResults,
  players,
  surveys,
  errors,
})

export default rootReducer
