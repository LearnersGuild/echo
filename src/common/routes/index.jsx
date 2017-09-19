/* eslint new-cap: [2, {"capIsNewExceptions": ["UserAuthWrapper"]}] */
/* global window */
import React from 'react'
import {Route, IndexRoute, IndexRedirect} from 'react-router'
import {UserAuthWrapper as userAuthWrapper} from 'redux-auth-wrapper'
import {push} from 'react-router-redux'

import {userCan} from 'src/common/util'
import {authorizationError} from 'src/common/actions/app'
import loginURL from 'src/common/util/auth'
import App from 'src/common/containers/App'
import ChapterForm from 'src/common/containers/ChapterForm'
import ChapterList from 'src/common/containers/ChapterList'
import UserList from 'src/common/containers/UserList'
import UserDetail from 'src/common/containers/UserDetail'
import ProjectForm from 'src/common/containers/ProjectForm'
import UserForm from 'src/common/containers/UserForm'
import ProjectList from 'src/common/containers/ProjectList'
import ProjectDetail from 'src/common/containers/ProjectDetail'
import RetroSurvey from 'src/common/containers/RetroSurvey'
import CycleVotingResults from 'src/common/containers/CycleVotingResults'
import Blank from 'src/common/components/Blank'
import NotFound from 'src/common/components/NotFound'
import Phases from 'src/common/containers/Phases'

const userIsAuthenticated = userAuthWrapper({
  authSelector: state => state.auth.currentUser,
  redirectAction: () => {
    if (typeof window !== 'undefined' && window.location) {
      window.location.href = loginURL({redirect: window.location.href})
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
      <IndexRedirect to="/phases"/>
      <Route path="/chapters" component={Blank}>
        <IndexRoute component={userCanVisit('listChapters', store)(ChapterList)}/>
        <Route path="new" component={userCanVisit('createChapter', store)(ChapterForm)}/>
        <Route path=":identifier" component={userCanVisit('updateChapter', store)(ChapterForm)}/>
      </Route>
      <Route path="/cycle-voting-results" component={Blank}>
        <IndexRoute component={userCanVisit('viewCycleVotingResults', store)(CycleVotingResults)}/>
      </Route>
      <Route path="/not-found" component={NotFound}/>
      <Route path="/projects" component={Blank}>
        <IndexRoute component={userCanVisit('listProjects', store)(ProjectList)}/>
        <Route path="new" component={userCanVisit('importProject', store)(ProjectForm)}/>
        <Route path=":identifier/edit" component={userCanVisit('importProject', store)(ProjectForm)}/>
        <Route path=":identifier" component={userCanVisit('viewProjectSummary', store)(ProjectDetail)}/>
      </Route>
      <Route path="/retro" component={Blank}>
        <IndexRoute component={userCanVisit('saveResponse', store)(RetroSurvey)}/>
        <Route path=":projectName" component={userCanVisit('saveResponse', store)(RetroSurvey)}/>
      </Route>
      <Route path="/users" component={Blank}>
        <IndexRoute component={userCanVisit('listUsers', store)(UserList)}/>
        <Route path=":identifier" component={userCanVisit('viewUserSummary', store)(UserDetail)}/>
        <Route path=":identifier/edit" component={userCanVisit('updateUser', store)(UserForm)}/>
      </Route>
      <Route path="/phases" component={Blank}>
        <IndexRoute component={userCanVisit('viewPhases', store)(Phases)}/>
        <Route path=":phaseNumber" component={userCanVisit('saveResponse', store)(Phases)}/>
      </Route>
    </Route>
  )
}

export default routes
