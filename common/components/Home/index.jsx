import React, {Component, PropTypes} from 'react'
import {Link} from 'react-router'
import {CardTitle} from 'react-toolbox/lib/card'
import {List, ListItem} from 'react-toolbox/lib/list'

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
      <a key={listItems.length} target="_blank" href={process.env.GRAPHIQL_BASE_URL} rel="noopener noreferrer">
        <ListItem
          caption="Explore API"
          leftIcon="flash_on"
          />
      </a>,
      <a key={listItems.length + 1} href={`${process.env.IDM_BASE_URL}/auth/sign-out`}>
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
