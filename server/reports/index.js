import express from 'express'

import {userCan} from 'src/common/util'

const app = new express.Router()

app.get('/reports/:reportName', requestHandler)

export default app

const VALID_REPORTS = [
  'cycleResponses',
  'projectTeams',
  'playerStats',
]

function requestHandler(req, res, next) {
  const {reportName} = req.params

  assertUserCanRunReports(req.user)
  assertReportNameIsValid(reportName)

  res.set('Content-Type', 'text/csv')
  return require(`./${reportName}`)(req, res).catch(next)
}

function assertUserCanRunReports(user) {
  if (!user || !userCan(user, 'runReports')) {
    throw new Error('You are not authorized to do that.')
  }
}

function assertReportNameIsValid(name) {
  if (!VALID_REPORTS.includes(name)) {
    throw new Error(`Invalid report name: "${name}". Valid reports are ${VALID_REPORTS.join(', ')}`)
  }
}
