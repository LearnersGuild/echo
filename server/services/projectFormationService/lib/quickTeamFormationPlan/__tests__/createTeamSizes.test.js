/* eslint-env mocha */
/* global testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import {assert} from 'chai'

import createTeamSizes from '../createTeamSizes'

describe(testContext(__filename), function () {
  context('createTeamSizes()', function () {
    context('determines optimal team sizes for input', function () {
      const tests = [
        {
          message: 'perfect teams, 1 advanced player on team',
          input: {recommended: 4, regular: 15, advanced: 2},
          expected: [
            {regular: 3, advanced: 1},
            {regular: 3, advanced: 1},
            {regular: 3, advanced: 1},
            {regular: 3, advanced: 1},
            {regular: 3, advanced: 1},
          ]
        },

        {
          message: 'rec size + 1, 1 advanced player on team',
          input: {recommended: 5, regular: 10, advanced: 1},
          expected: [
            {regular: 5, advanced: 1},
            {regular: 5, advanced: 1},
          ]
        },

        {
          message: 'rec size + 1, 1 advanced player on team',
          input: {recommended: 4, regular: 16, advanced: 2},
          expected: [
            {regular: 4, advanced: 1},
            {regular: 3, advanced: 1},
            {regular: 3, advanced: 1},
            {regular: 3, advanced: 1},
            {regular: 3, advanced: 1},
          ]
        },

        {
          message: 'rec size + 1, multiple advanced players on team',
          input: {recommended: 4, regular: 6, advanced: 4},
          expected: [
            {regular: 3, advanced: 2},
            {regular: 3, advanced: 2},
          ]
        },

        {
          message: 'rec size - 1, 1 advanced player on team',
          input: {recommended: 4, regular: 14, advanced: 2},
          expected: [
            {regular: 3, advanced: 1},
            {regular: 3, advanced: 1},
            {regular: 3, advanced: 1},
            {regular: 3, advanced: 1},
            {regular: 2, advanced: 1},
          ]
        },

        {
          message: 'rec size - 1, 1 advanced player on team',
          input: {recommended: 4, regular: 4, advanced: 2},
          expected: [
            {regular: 2, advanced: 1},
            {regular: 2, advanced: 1},
          ]
        },

        {
          message: 'a wonky team',
          input: {recommended: 4, regular: 1, advanced: 1},
          expected: [{regular: 1, advanced: 1}]
        },
      ]

      tests.forEach(test => {
        const {recommended, regular, advanced} = test.input
        const result = createTeamSizes(recommended, regular, advanced)
        it(test.message, function () {
          assert.deepEqual(result, test.expected, `recommended (${recommended}), regular (${regular}), advanced (${advanced}`)
        })
      })
    })
  })
})
