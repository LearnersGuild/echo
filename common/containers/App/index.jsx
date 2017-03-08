/* global window */
import React, {Component, PropTypes} from 'react'
import {Link} from 'react-router'
import {connect} from 'react-redux'
import ProgressBar from 'react-toolbox/lib/progress_bar'
import AppBar from 'react-toolbox/lib/app_bar'
import Avatar from 'react-toolbox/lib/avatar'
import FontIcon from 'react-toolbox/lib/font_icon'
import {IconMenu, MenuItem, MenuDivider} from 'react-toolbox/lib/menu'

import StatusBar from 'src/common/components/StatusBar'
import {Flex} from 'src/common/components/Layout'
import {dismissError, dismissMessage} from 'src/common/actions/app'
import {userCan} from 'src/common/util'

import styles from './index.scss'
import theme from './theme.scss'

const navItems = [
  {
    label: 'Projects',
    permission: 'listProjects',
    path: '/projects',
  },
  {
    label: 'Users',
    permission: 'listUsers',
    path: '/users',
  },
  {
    label: 'Chapters',
    permission: 'listChapters',
    path: '/chapters',
  },
]

export class App extends Component {
  constructor(props) {
    super(props)
    this.handleClickProfile = this.handleClickProfile.bind(this)
    this.handleClickSignOut = this.handleClickSignOut.bind(this)
    this.renderNavigation = this.renderNavigation.bind(this)
    this.renderLoading = this.renderLoading.bind(this)
    this.renderMain = this.renderMain.bind(this)
    this.renderFooter = this.renderFooter.bind(this)
  }

  handleClickProfile() {
    window.location = '/profile'
  }

  handleClickSignOut() {
    window.location = `${process.env.IDM_BASE_URL}/auth/sign-out?redirect=${process.env.APP_BASE_URL}`
  }

  renderNavigation() {
    const {auth: {currentUser = {}}} = this.props
    const avatar = <Avatar><img src={currentUser.avatarUrl || process.env.LOGO_SHORT_URL}/></Avatar>
    return (
      <div className={styles.nav}>
        <AppBar theme={theme} className={styles.appbar} flat>
          <Flex className={styles.navBar} justifyContent="center" fill>
            <Flex className={styles.container} justifyContent="space-between" alignItems="center" fill>
              <Link to="/">
                <Flex className={styles.navBarLeft} justifyContent="center" alignItems="center">
                  <Avatar className={theme.avatar}>
                    <img
                      src="https://brand.learnersguild.org/android-chrome-48x48.png"
                      title="Learners Guild"
                      alt="Learners Guild"
                      />
                  </Avatar>
                </Flex>
              </Link>
              <Flex className={styles.navBarRight} justifyContent="flex-end" alignItems="center">
                <nav className={styles.navigation}>
                  <ul>
                    {navItems.filter(item => (
                      userCan(currentUser, item.permission)
                    )).map((item, i) => (
                      <li key={i}>
                        <Link activeClassName={styles.active} to={item.path}>{item.label}</Link>
                      </li>
                    ))}
                  </ul>
                </nav>
                <IconMenu theme={theme} icon={avatar} position="topRight">
                  <MenuItem>
                    <a className={styles.menuItem} onClick={this.handleClickProfile}>
                      <Flex alignItems="center">
                        <FontIcon className={styles.menuItemIcon} value="account_circle"/>
                        <span>My Profile</span>
                      </Flex>
                    </a>
                  </MenuItem>
                  <MenuDivider/>
                  <MenuItem>
                    <a className={styles.menuItem} onClick={this.handleClickSignOut}>
                      <Flex alignItems="center">
                        <FontIcon className={styles.menuItemIcon} value="exit_to_app"/>
                        <span>Sign out</span>
                      </Flex>
                    </a>
                  </MenuItem>
                </IconMenu>
              </Flex>
            </Flex>
          </Flex>
        </AppBar>
      </div>
    )
  }

  renderLoading() {
    return this.props.app.showLoading ? (
      <ProgressBar theme={theme} mode="indeterminate"/>
    ) : null
  }

  renderMain() {
    return !this.props.auth.currentUser && this.props.app.isBusy ? null : (
      <div className={styles.mainWrapper}>
        <Flex className={styles.main} justifyContent="center" alignItems="center">
          <div className={styles.container}>
            <div className={styles.content}>
              {this.props.children}
            </div>
          </div>
        </Flex>
      </div>
    )
  }

  renderFooter() {
    const {dismissError, dismissMessage, app: {errors, messages}} = this.props
    const message = messages.map((message, i) => {
      const handleDismiss = () => dismissMessage(i)
      return (
        <StatusBar key={i} onDismiss={handleDismiss} message={message} type="accept"/>
      )
    })
    const error = errors.map((errorMessage, i) => {
      const handleDismiss = () => dismissError(i)
      return (
        <StatusBar key={i} onDismiss={handleDismiss} message={errorMessage} type="warning"/>
      )
    })

    return (
      <div className={styles.footer}>
        <div className={styles.container}>
          {message}
          {error}
        </div>
      </div>
    )
  }

  render() {
    return (
      <div className={styles.app}>
        {this.renderNavigation()}
        {this.renderLoading()}
        {this.renderMain()}
        {this.renderFooter()}
      </div>
    )
  }
}

App.propTypes = {
  app: PropTypes.shape({
    isBusy: PropTypes.bool.isRequired,
    showLoading: PropTypes.bool.isRequired,
    errors: PropTypes.array.isRequired,
  }),
  auth: PropTypes.shape({
    currentUser: PropTypes.object.isRequired,
  }),
  children: PropTypes.any,
  dismissError: PropTypes.func.isRequired,
  dismissMessage: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
  return {
    app: state.app,
    auth: state.auth,
    errors: state.errors,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    dismissError: error => dispatch(dismissError(error)),
    dismissMessage: message => dispatch(dismissMessage(message)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
