/* eslint new-cap: [2, {"capIsNewExceptions": ["UserAuthWrapper"]}] */
import React from 'react'
import {Route, IndexRoute} from 'react-router'
import {UserAuthWrapper} from 'redux-auth-wrapper'
import {push} from 'react-router-redux'

import authorizationError from '../actions/authorizationError'
import App from '../containers/App'
import BlankLayout from '../containers/BlankLayout'
import CardLayout from '../components/CardLayout'
import Home from '../containers/Home'
import ChapterForm from '../containers/ChapterForm'
import ChapterList from '../containers/ChapterList'
import PlayerList from '../containers/PlayerList'
import CycleVotingResults from '../containers/CycleVotingResults'

import {userCan} from '../util'

const userIsAuthenticated = UserAuthWrapper({
  authSelector: state => state.auth.currentUser,
  redirectAction: () => {
    /* global __DEVELOPMENT__ __CLIENT__ window */
    if (__CLIENT__) {
      const baseURL = __DEVELOPMENT__ ? 'http://idm.learnersguild.dev' : 'https://idm.learnersguild.org'
      window.location.href = `${baseURL}/sign-in?redirect=${encodeURIComponent(window.location.href)}`
    }
    return {type: 'ignore'}
  },
  wrapperDisplayName: 'userIsAuthenticated',
})
const userCanVisit = (capability, store) => {
  return UserAuthWrapper({
    authSelector: state => state.auth.currentUser,
    predicate: currentUser => userCan(currentUser, capability),
    failureRedirectPath: '/',
    allowRedirectBack: false,
    redirectAction: failureRedirectPath => {
      const {dispatch} = store
      dispatch(authorizationError('You are not authorized to do that.'))
      dispatch(push(failureRedirectPath))
      return {type: 'ignore'}
    },
    wrapperDisplayName: 'userCan',
  })
}

const routes = store => {
  // <Route path="/chapters" component={userCan('listChapters')(ChapterList)}/>
  return (
    <Route path="/" component={App}>
      <Route component={BlankLayout}>
        <Route component={CardLayout}>
          <IndexRoute component={userIsAuthenticated(Home)}/>
          <Route path="/chapters" component={userCanVisit('listChapters', store)(userIsAuthenticated(ChapterList))}/>
          <Route path="/chapters/new" component={userCanVisit('createChapter', store)(userIsAuthenticated(ChapterForm))}/>
          <Route path="/chapters/:id" component={userCanVisit('updateChapter', store)(userIsAuthenticated(ChapterForm))}/>
          <Route path="/players" component={userCanVisit('listPlayers', store)(userIsAuthenticated(PlayerList))}/>
          <Route path="/cycle-voting-results" component={userCanVisit('viewCycleVotingResults', store)(userIsAuthenticated(CycleVotingResults))}/>
        </Route>
      </Route>
    </Route>
  )
}
export default routes
