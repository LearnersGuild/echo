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

    describe('collapsed / expanded', function () {
      beforeEach(async function () {
        const mineUsers = await factory.buildMany('user', 3)
        mineUsers.push(this.currentUser)
        const mineVoterPlayerIds = [this.currentUser.id, mineUsers[0].id]
        const minePlayerGoalRank = await factory.build('playerGoalRank', {playerId: this.currentUser.id})
        this.mineCandidateGoals = new Array(3).fill({
          playerGoalRanks: [minePlayerGoalRank],
          goal: {
            url: 'https://www.example.com/goals/40',
            title: 'goal name (#40)',
          }
        })
        const minePool = {
          name: 'mine',
          candidateGoals: this.mineCandidateGoals,
          users: mineUsers,
          voterPlayerIds: mineVoterPlayerIds,
          votingIsStillOpen: true,
        }

        const otherUsers = await factory.buildMany('user', 3)
        const otherVoterPlayerIds = [otherUsers[0].id, otherUsers[1].id]
        const otherPlayerGoalRank = await factory.build('playerGoalRank', {playerId: otherUsers[0].id})
        this.otherCandidateGoals = new Array(3).fill({
          playerGoalRanks: [otherPlayerGoalRank],
          goal: {
            url: 'https://www.example.com/goals/40',
            title: 'goal name (#40)',
          }
        })
        const otherPool = {
          name: 'other',
          candidateGoals: this.otherCandidateGoals,
          users: otherUsers,
          voterPlayerIds: otherVoterPlayerIds,
          votingIsStillOpen: true,
        }

        this.pools = [minePool, otherPool]
      })

      it('expands the pool that the current user is in', function () {
        const props = this.getProps({pools: this.pools})
        const root = mount(React.createElement(CycleVotingResults, props))
        root.update()
        const candidateGoalEls = root.find('CandidateGoal')

        expect(candidateGoalEls.length).to.equal(this.mineCandidateGoals.length)
      })

      it('keeps pools expanded once a user has expanded it', function () {
        const props = this.getProps({pools: this.pools})
        const root = mount(React.createElement(CycleVotingResults, props))

        // because the animations take some time, we have to check state rather than
        // counting components like we do above -- not ideal
        let state = root.state()
        expect(state.poolIsExpanded.other).to.equal(undefined)

        root.setState({poolIsExpanded: {...root.state('poolIsExpanded'), other: true}})
        root.setProps(props)
        state = root.state()
        expect(state.poolIsExpanded.other).to.equal(true)
      })
    })
  })
})
