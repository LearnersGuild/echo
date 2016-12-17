/* eslint new-cap: [2, {"capIsNewExceptions": ["UserAuthWrapper"]}] */
/* global __CLIENT__ window */
import React from 'react'
import {Route, IndexRoute, IndexRedirect} from 'react-router'
import {UserAuthWrapper as userAuthWrapper} from 'redux-auth-wrapper'
import {push} from 'react-router-redux'

import {userCan} from 'src/common/util'
import {authorizationError} from 'src/common/actions/app'
import App from 'src/common/containers/App'
import ChapterForm from 'src/common/containers/ChapterForm'
import ChapterList from 'src/common/containers/ChapterList'
import UserList from 'src/common/containers/UserList'
import UserDetail from 'src/common/containers/UserDetail'
import RetroSurvey from 'src/common/containers/RetroSurvey'
import CycleVotingResults from 'src/common/containers/CycleVotingResults'
import Blank from 'src/common/components/Blank'
import NotFound from 'src/common/components/NotFound'

const userIsAuthenticated = userAuthWrapper({
  authSelector: state => state.auth.currentUser,
  redirectAction: () => {
    if (__CLIENT__) {
      window.location.href = `${process.env.IDM_BASE_URL}/sign-in?redirect=${encodeURIComponent(window.location.href)}`
    }
    return {type: 'ignore'}
  },
  wrapperDisplayName: 'userIsAuthenticated',
})
const userCanVisit = (capability, store) => {
  return userAuthWrapper({
    authSelector: state => state.auth.currentUser,
    predicate: currentUser => userCan(currentUser, capability),
    failureRedirectPath: '/not-found',
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
  return (
    <Route path="/" component={userIsAuthenticated(App)}>
      <IndexRedirect to="/chapters"/>
      <Route path="/chapters" component={Blank}>
        <IndexRoute component={userCanVisit('listChapters', store)(ChapterList)}/>
        <Route path="new" component={userCanVisit('createChapter', store)(ChapterForm)}/>
        <Route path=":id" component={userCanVisit('updateChapter', store)(ChapterForm)}/>
      </Route>
      <Route path="/users" component={Blank}>
        <IndexRoute component={userCanVisit('listUsers', store)(UserList)}/>
        <Route path=":identifier" component={userCanVisit('viewUser', store)(UserDetail)}/>
      </Route>
      <Route path="/retro" component={Blank}>
        <IndexRoute component={userCanVisit('saveResponse', store)(RetroSurvey)}/>
        <Route path=":projectName" component={userCanVisit('saveResponse', store)(RetroSurvey)}/>
      </Route>
      <Route path="/cycle-voting-results" component={Blank}>
        <IndexRoute component={userCanVisit('viewCycleVotingResults', store)(CycleVotingResults)}/>
      </Route>
      <Route path="/not-found" component={NotFound}/>
    </Route>
  )
}

export default routes
