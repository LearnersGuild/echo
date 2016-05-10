import React, {Component, PropTypes} from 'react'
import {Link} from 'react-router'

import {CardTitle} from 'react-toolbox/lib/card'
import {List, ListItem} from 'react-toolbox/lib/list'

/* global __DEVELOPMENT__ */
const graphiqlAppName = 'graphiql.learnersguild'
const graphiqlUrl = __DEVELOPMENT__ ? `http://${graphiqlAppName}.dev` : `https://${graphiqlAppName}.org`
const signOutAppName = 'idm.learnersguild'
const signOutUrl = __DEVELOPMENT__ ? `http://${signOutAppName}.dev/auth/sign-out` : `https://${signOutAppName}.org/auth/sign-out`

export default class Home extends Component {
  render() {
    const {showListChapters, showListPlayers} = this.props

    const listItems = []
    if (showListChapters) {
      listItems.push(
        <Link key={listItems.length} to="/chapters">
          <ListItem
            caption="Chapters"
            leftIcon="view_list"
            />
        </Link>
      )
    }
    if (showListPlayers) {
      listItems.push(
        <Link key={listItems.length} to="/players">
          <ListItem
            caption="Players"
            leftIcon="people"
            />
        </Link>
      )
    }
    listItems.push(
      <a key={listItems.length} target="_blank" href={graphiqlUrl}>
        <ListItem
          caption="Explore API"
          leftIcon="flash_on"
          />
      </a>,
      <a key={listItems.length + 1} href={signOutUrl}>
        <ListItem
          caption="Sign Out"
          leftIcon="subdirectory_arrow_left"
          />
      </a>
    )

    return (
      <div>
        <CardTitle
          avatar="https://brand.learnersguild.org/apple-touch-icon-60x60.png"
          title="Game"
          />
        <List selectable ripple>
          {listItems}
        </List>
      </div>
    )
  }
}

Home.propTypes = {
  showListChapters: PropTypes.bool.isRequired,
  showListPlayers: PropTypes.bool.isRequired,
}
