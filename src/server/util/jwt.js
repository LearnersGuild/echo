import jwt from 'jsonwebtoken'

import config from 'src/config'
import {ADMIN} from 'src/common/models/user'

const JWT_ISSUER = 'learnersguild.org'

export default function serverToServerJWT() {
  /* eslint-disable camelcase */
  const now = Math.floor(Date.now() / 1000)
  const claims = {
    iss: JWT_ISSUER,
    iat: now,
    exp: now + (60 * 10),  // 10 minutes from now
    sub: 0,
    name: 'Server-to-Server Authentication',
    preferred_username: '__server_to_server__',
    email: 'noreply@learnersguild.org',
    emails: 'noreply@learnersguild.org',
    roles: ADMIN,
  }
  return jwt.sign(claims, config.server.jwt.privateKey, {algorithm: config.server.jwt.algorithm})
}
