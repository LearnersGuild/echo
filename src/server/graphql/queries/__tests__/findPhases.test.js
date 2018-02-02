/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import {resetDB, runGraphQLQuery} from 'src/test/helpers'
import {Phase} from 'src/server/services/dataService'

import findPhases from '../findPhases'

const fields = {findPhases}
const query = `
  query {
    findPhases {
      id number
    }
  }
`

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  it('returns all phases', async function () {
    const results = await runGraphQLQuery(fields, query)
    const phases = await Phase.run()
    expect(results.data.findPhases.length).to.equal(phases.length)
  })

  it('returns an empty array if there are no phases', async function () {
    await Phase.delete()
    const results = await runGraphQLQuery(fields, query)
    expect(results.data.findPhases.length).to.equal(0)
  })

  it('throws an error if user is not signed-in', function () {
    const context = {currentUser: null}
    const promise = runGraphQLQuery(fields, query, context)
    return expect(promise).to.eventually.be.rejectedWith(/not authorized/i)
  })
})
