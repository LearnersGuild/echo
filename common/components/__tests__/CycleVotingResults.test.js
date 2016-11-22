/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import React from 'react'
import {shallow, mount} from 'enzyme'

import CycleVotingResults from 'src/common/components/CycleVotingResults'
import factory from 'src/test/factories'

describe(testContext(__filename), function () {
  before(async function () {
    this.currentUser = await factory.build('user')
    const chapter = await factory.build('chapter')
    const cycle = await factory.build('cycle')
    this.getProps = customProps => {
      const baseProps = {
        currentUser: this.currentUser,
        chapter,
        cycle,
        pools: [{
          name: 'Turquoise',
          candidateGoals: [],
          users: [],
          voterPlayerIds: [],
          votingIsStillOpen: true,
        }, {
          name: 'Magenta',
          candidateGoals: [],
          users: [],
          voterPlayerIds: [],
          votingIsStillOpen: false,
        }],
        isBusy: false,
        onClose: () => null,
      }
      return customProps ? Object.assign({}, baseProps, customProps) : baseProps
    }
  })

  describe('interactions', function () {
    it('clicking the close link calls onClose', function () {
      let clicked = false

      const root = shallow(React.createElement(CycleVotingResults, this.getProps({
        onClose: () => {
          clicked = true
        }
      })))

      const closeLink = root.findWhere(el => {
        return el.name() === 'a' &&
          el.html().includes('Close Voting Results')
      }).first()

      closeLink.simulate('click')

      expect(clicked).to.equal(true)
    })
  })

  describe('rendering', function () {
    it('displays progress bar if isBusy', function () {
      const root = shallow(React.createElement(CycleVotingResults, this.getProps({isBusy: true})))
      const progressBars = root.find('ThemedProgressBar')

      expect(progressBars.length).to.equal(1)
    })

    it('lets the user know there are no results when that is the case', function () {
      const props = this.getProps({cycle: null})
      const root = shallow(React.createElement(CycleVotingResults, props))

      expect(root.html()).to.contain('no voting results to display')
    })

    it('renders the cycle number and chapter name', function () {
      const props = this.getProps()
      const root = shallow(React.createElement(CycleVotingResults, props))

      expect(root.html()).to.contain(`Cycle ${props.cycle.cycleNumber} Candidate Goals (${props.chapter.name})`)
    })

    it('renders a link to the goal library', function () {
      const props = this.getProps()
      const root = shallow(React.createElement(CycleVotingResults, props))
      const goalRepoLinks = root.findWhere(node => {
        return node.name() === 'a' &&
          (node.props().href || '').startsWith(props.chapter.goalRepositoryURL)
      })

      expect(goalRepoLinks.length).to.equal(1)
    })

    it('renders the correct number of pools', function () {
      const props = this.getProps()
      const root = shallow(React.createElement(CycleVotingResults, props))
      const poolEls = root.find('VotingPoolResults')

      expect(poolEls.length).to.equal(props.pools.length)
    })

    it('collapses / uncollapses pools appropriately as props change', async function () {
      const origProps = this.getProps({pools: []})
      const root = mount(React.createElement(CycleVotingResults, origProps))
      let candidateGoalEls = root.find('CandidateGoal')

      expect(candidateGoalEls.length).to.equal(0)

      const users = await factory.buildMany('user', 3)
      users.push(this.currentUser)
      const voterPlayerIds = [this.currentUser.id, users[0].id]
      const playerGoalRank = await factory.build('playerGoalRank', {playerId: this.currentUser.id})
      const candidateGoals = new Array(3).fill({
        playerGoalRanks: [playerGoalRank],
        goal: {
          url: 'https://www.example.com/goals/40',
          title: 'goal name (#40)',
        }
      })
      const pools = [{
        name: 'Jet Black',
        candidateGoals,
        users,
        voterPlayerIds,
        votingIsStillOpen: true,
      }]
      const newProps = this.getProps({pools})
      root.setProps(newProps)
      candidateGoalEls = root.find('CandidateGoal')
      expect(candidateGoalEls.length).to.equal(candidateGoals.length)
    })
  })
})
