/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import React from 'react'
import {shallow, mount} from 'enzyme'

import ProjectList from 'src/common/components/ProjectList'
import factory from 'src/test/factories'

describe(testContext(__filename), function () {
  // Variables for text in ProjectList that may change
  const buttonLabel = 'Load More...'
  const noProjectsMessage = 'No projects found.'
  const tableHeaderName = 'Name'
  const tableHeaderCycle = 'Cycle'
  const projectModel = {
    name: {title: 'Name', type: String},
    state: {title: 'State', type: String},
    week: {title: 'Week', type: String},
    cycleNumber: {title: 'Cycle', type: String},
    phaseName: {title: 'Phase', type: String},
    goalTitle: {title: 'Goal', type: String},
    hasArtifact: {title: 'Artifact?', type: String},
    memberHandles: {title: 'Members', type: String},
  }

  function createProjectList(props) {
    return shallow(React.createElement(ProjectList, props))
  }

  function buildProjectProps({projects, cycle, phase, users}) {
    const projectData = []
    projects.forEach(function (project) {
      const {cycleNumber, state} = cycle
      projectData.push({
        cycleNumber,
        state,
        week: '07-26-17',
        name: project.name,
        phaseName: phase.name,
        goalTitle: project.goal.title,
        memberHandles: users.map(u => u.handle).join(', '),
      })
    })
    return projectData
  }

  before(async function () {
    this.cycle = await factory.build('cycle')
    this.phase = await factory.build('phase')
    this.users = await factory.buildMany('user', 3)
    this.projects = await factory.buildMany('project', {
      cycleId: this.cycle.id,
      chapterId: this.cycle.chapterId,
      phaseId: this.phase.id,
      memberIds: this.users.map(u => u.id),
    }, 6)
    this.getProps = function (customProps) {
      const baseProps = {
        projectModel,
        projectData: buildProjectProps({
          cycle: this.cycle,
          phase: this.phase,
          projects: this.projects,
          users: this.users,
        }),
      }
      return customProps ? Object.assign({}, baseProps, customProps) : baseProps
    }
  })

  describe('rendering', function () {
    it('should display column headings', function () {
      const root = createProjectList(this.getProps())

      Object.keys(projectModel).map(key => {
        return expect(root.html()).to.contain(projectModel[key].title)
      })
    })

    it('should display the provided projects', function () {
      const root = createProjectList(this.getProps())

      expect(root.html()).to.contain(this.projects[0].name)
      expect(root.html()).to.contain(this.users.map(u => u.handle).join(', '))
      expect(root.html()).to.contain('07-26-17')
      expect(root.html()).to.contain(this.cycle.state)
      expect(root.html()).to.contain(buttonLabel)
      expect(root.html()).to.contain('<table')
    })

    it('should display \'No projects found.\' if no projects exist', function () {
      const props = this.getProps({projectData: []})
      const root = createProjectList(props)

      expect(root.html()).to.contain(noProjectsMessage)
      expect(root.html()).to.not.contain(tableHeaderName).and.to.not.contain(tableHeaderCycle)
      expect(root.html()).to.not.contain(buttonLabel)
      expect(root.html()).to.not.contain('<table')
    })
  })

  describe('interactions', function () {
    it('click \'Load More...\' should call the provided callback function', function () {
      let clicked = false
      const props = this.getProps({
        onLoadMoreClicked: () => {
          clicked = true
        }
      })
      const root = mount(React.createElement(ProjectList, props))
      const loadMoreButton = root.findWhere(el => {
        return el.name() === 'button' &&
          el.html().includes(buttonLabel)
      }).first()

      loadMoreButton.simulate('click')

      expect(clicked).to.eq(true)
    })
  })
})
