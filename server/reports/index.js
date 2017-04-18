import express from 'express'

import {userCan} from 'src/common/util'
import {LGNotAuthorizedError, LGBadRequestError} from 'src/server/util/error'
import {writeCSV} from './util'

const SENSITIVE_REPORTS = [
  'projectTeams',
  'playerStats',
  'playerCycleStats',
  'playerRetroFeedback',
]
const PUBLIC_REPORTS = [
  'countActivePlayersByLevel',
]

const app = new express.Router()

app.get('/reports/:reportName', async (req, res, next) => {
  const {reportName} = req.params

  _assertReportNameIsValid(reportName)
  _assertUserCanViewReport(req.user)

  try {
    let createReport = require(`./${reportName}`)
    if (typeof createReport !== 'function') {
      createReport = createReport.default
    }

    const {rows, headers, filename} = await createReport(req, res)
    const options = headers ? {headers} : null

    res.set('Content-Type', 'text/csv')
    if (filename) {
      res.setHeader('Content-disposition', `attachment; filename=${filename}`)
    }

    return writeCSV(res, rows, options)
  } catch (err) {
    next(err)
  }
})

function _assertUserCanViewReport(user, reportName) {
  if (SENSITIVE_REPORTS.includes(reportName)) {
    if (!user || !userCan(user, 'viewSensitiveReports')) {
      throw new LGNotAuthorizedError()
    }
  }
}

function _assertReportNameIsValid(name) {
  const validReportNames = SENSITIVE_REPORTS.concat(PUBLIC_REPORTS)
  if (!validReportNames.includes(name)) {
    throw new LGBadRequestError(`Invalid report name: "${name}". Valid reports are ${validReportNames.join(', ')}`)
  }
}

export default app
