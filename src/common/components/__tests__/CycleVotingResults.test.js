/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import React from 'react'
import {shallow, mount} from 'enzyme'

import config from 'src/config'
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
          phase: {
            number: 1
          },
          candidateGoals: [],
          members: [],
          voterMemberIds: [],
          votingIsStillOpen: true,
        }, {
          name: 'Magenta',
          phase: {
            number: 2
          },
          candidateGoals: [],
          members: [],
          voterMemberIds: [],
          votingIsStillOpen: false,
        }],
        onClose: () => null,
        goalLibraryURL: config.server.goalLibrary.baseURL,
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
          (node.props().href || '').startsWith(config.server.goalLibrary.baseURL)
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
        const myPoolMembers = await factory.buildMany('user', 3)
        myPoolMembers.push(this.currentUser)
        const myPoolVoterMemberIds = [this.currentUser.id, myPoolMembers[0].id]
        const myPoolMemberGoalRank = await factory.build('memberGoalRank', {memberId: this.currentUser.id})
        this.myPoolCandidateGoals = new Array(3).fill({
          memberGoalRanks: [myPoolMemberGoalRank],
          goal: {
            url: `${config.server.goalLibrary.baseURL}/goals/40`,
            title: 'goal name (#40)',
            number: 40,
          }
        })
        const myePool = {
          name: 'mine',
          phase: {
            number: 2
          },
          candidateGoals: this.myPoolCandidateGoals,
          members: myPoolMembers,
          voterMemberIds: myPoolVoterMemberIds,
          votingIsStillOpen: true,
        }

        const otherUsers = await factory.buildMany('user', 3)
        const otherVoterMemberIds = [otherUsers[0].id, otherUsers[1].id]
        const otherMemberGoalRank = await factory.build('memberGoalRank', {memberId: otherUsers[0].id})
        this.otherCandidateGoals = new Array(3).fill({
          memberGoalRanks: [otherMemberGoalRank],
          goal: {
            url: `${config.server.goalLibrary.baseURL}/goals/40`,
            title: 'goal name (#40)',
            number: 40,
          }
        })
        const otherPool = {
          name: 'other',
          phase: {
            number: 1
          },
          candidateGoals: this.otherCandidateGoals,
          members: otherUsers,
          voterMemberIds: otherVoterMemberIds,
          votingIsStillOpen: true,
        }

        this.pools = [myePool, otherPool]
      })

      it('expands the pool that the current user is in', function () {
        const props = this.getProps({pools: this.pools})
        const root = mount(React.createElement(CycleVotingResults, props))
        root.update()
        const candidateGoalEls = root.find('CandidateGoal')

        expect(candidateGoalEls.length).to.equal(this.myPoolCandidateGoals.length)
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
