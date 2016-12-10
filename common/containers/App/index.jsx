import React, {Component, PropTypes} from 'react'
import {Link} from 'react-router'
import {connect} from 'react-redux'
import ProgressBar from 'react-toolbox/lib/progress_bar'
import AppBar from 'react-toolbox/lib/app_bar'
import Avatar from 'react-toolbox/lib/avatar'
import FontIcon from 'react-toolbox/lib/font_icon'
import {IconMenu, MenuItem, MenuDivider} from 'react-toolbox/lib/menu'

import ErrorBar from 'src/common/components/ErrorBar'
import {Flex} from 'src/common/components/Layout'
import {dismissError} from 'src/common/actions/app'
import {userCan} from 'src/common/util'

import styles from './index.scss'
import theme from './theme.scss'

const navItems = [
  {
    label: 'Chapters',
    permission: 'listChapters',
    path: '/chapters',
  },
  {
    label: 'Users',
    permission: 'listUsers',
    path: '/users',
  },
]

export class App extends Component {
  constructor(props) {
    super(props)
    this.renderNavigation = this.renderNavigation.bind(this)
    this.renderLoading = this.renderLoading.bind(this)
    this.renderMain = this.renderMain.bind(this)
    this.renderFooter = this.renderFooter.bind(this)
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
                  <h4 className={styles.navBarTitle}>LG</h4>
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
                    <Flex className={styles.menuItem} alignItems="center">
                      <FontIcon className={styles.menuItemIcon} value="account_circle"/>
                      <a href={`${process.env.IDM_BASE_URL}/profile`} target="_blank" rel="noopener noreferrer">
                        My Profile
                      </a>
                    </Flex>
                  </MenuItem>
                  <MenuDivider/>
                  <MenuItem>
                    <Flex className={styles.menuItem} alignItems="center">
                      <FontIcon className={styles.menuItemIcon} value="exit_to_app"/>
                      <a href={`${process.env.IDM_BASE_URL}/auth/sign-out?redirect=${process.env.APP_BASE_URL}`}>
                        Sign out
                      </a>
                    </Flex>
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
    return this.props.app.isBusy ? (
      <ProgressBar theme={theme} mode="indeterminate"/>
    ) : null
  }

  renderMain() {
    return !this.props.auth.currentUser && this.props.app.isBusy ? null : (
      <div className={styles.main}>
        <div className={styles.container}>
          <div className={styles.content}>
            {this.props.children}
          </div>
        </div>
      </div>
    )
  }

  renderFooter() {
    const {dispatch, app: {errors}} = this.props
    return (
      <div className={styles.footer}>
        <div className={styles.container}>
          {errors.map((errorMessage, i) => {
            const handleDismiss = () => dispatch(dismissError(i))
            return (
              <ErrorBar key={i} onDismiss={handleDismiss} message={errorMessage}/>
            )
          })}
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
    errors: PropTypes.array.isRequired,
  }),
  auth: PropTypes.shape({
    currentUser: PropTypes.object.isRequired,
  }),
  children: PropTypes.any,
  dispatch: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
  return {
    app: state.app,
    auth: state.auth,
    errors: state.errors,
  }
}

export default connect(mapStateToProps)(App)
