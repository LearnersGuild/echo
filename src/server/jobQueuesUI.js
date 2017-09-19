import url from 'url'
import express from 'express'
import toureiro from 'toureiro'

import config from 'src/config'
import {userCan} from 'src/common/util'
import {LGNotAuthorizedError} from 'src/server/util/error'
import loginURL from 'src/common/util/auth'

const app = new express.Router()
const redisConfig = url.parse(config.server.redis.url)
const redisPasswordOpts = redisConfig.auth ? {auth_pass: redisConfig.auth.split(':')[1]} : {} // eslint-disable-line camelcase
const toureiroApp = toureiro({
  redis: {
    host: redisConfig.hostname,
    port: redisConfig.port,
    ...redisPasswordOpts,
  },
})

app.use(
  '/job-queues',
  (req, res, next) => {
    if (!req.user) {
      const redirectUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`
      return res.redirect(loginURL({redirect: redirectUrl}))
    }
    if (!userCan(req.user, 'monitorJobQueues')) {
      return next(new LGNotAuthorizedError())
    }
    next()
  },
  toureiroApp
)

export default app
