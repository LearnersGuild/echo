/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import {
  goalFromGithubIssue,
  goalFromGoalLibraryMetadata,
  goalFromMetadata,
  renderGoalAsString,
} from '../goal'

/* eslint-disable camelcase */
describe(testContext(__filename), function () {
  const githubIssue = {
    body: 'goal body',
    title: 'goal title',
    number: 144,
    html_url: 'https://github.com/GuildCrafts/web-development-js/issues/144',
    url: 'https://api.github.com/repos/GuildCrafts/web-development-js/issues/144',
    labels: [{name: 'core'}, {name: 'practice'}, {name: 'team-size-3'}],
    milestone: {title: 'Level 2'},
  }
  const goalMetadata = {
    content: 'goal content',
    title: 'goal title',
    goal_id: 144,
    url: 'https://jsdev.learnersguild.org/goals/144-goal_content.html',
    team_size: 3,
    level: 2,
  }

  describe('goalFromGithubIssue()', function () {
    it('extracts the correct information from the GitHub issue', function () {
      const goal = goalFromGithubIssue(githubIssue)
      expect(goal).to.deep.eq({
        url: githubIssue.html_url,
        title: githubIssue.title,
        number: githubIssue.number,
        teamSize: 3,
        level: 2,
        githubIssue,
      })
    })

    it('throws an error if an unparseable GitHub issue is passed', function () {
      const invocation = () => goalFromGithubIssue({a: 'b', c: 'd'})
      expect(invocation).to.throw
    })
  })

  describe('goalFromGoalLibraryMetadata()', function () {
    it('extracts the correct information from the goal metadata', function () {
      const goal = goalFromGoalLibraryMetadata(goalMetadata)
      expect(goal).to.deep.eq({
        url: goalMetadata.url,
        teamSize: goalMetadata.team_size,
        title: goalMetadata.title,
        number: goalMetadata.goal_id,
        level: goalMetadata.level,
        goalMetadata,
      })
    })

    it('throws an error if unparseable goal metadata issue is passed', function () {
      const invocation = () => goalFromGoalLibraryMetadata({a: 'b', c: 'd'})
      expect(invocation).to.throw
    })
  })

  describe('goalFromMetadata()', function () {
    it('detects GitHub issues and parses', function () {
      expect(goalFromMetadata(githubIssue)).to.deep.eq(goalFromGithubIssue(githubIssue))
    })

    it('detects Goal Library issues and parses', function () {
      expect(goalFromMetadata(goalMetadata)).to.deep.eq(goalFromGoalLibraryMetadata(goalMetadata))
    })
  })

  describe('renderGoalAsString()', function () {
    it('renders the level when available', function () {
      const goal = {number: 144, level: 2, title: 'goal title'}
      const rendered = renderGoalAsString(goal)
      expect(rendered).to.contain(` [L${goal.level}]`)
    })

    it('renders the goal number and title', function () {
      const goal = {number: 144, title: 'goal title'}
      const rendered = renderGoalAsString(goal)
      expect(rendered).to.contain(`#${goal.number}`)
      expect(rendered).to.contain(`${goal.title}`)
    })
  })
})
