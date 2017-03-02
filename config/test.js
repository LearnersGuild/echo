module.exports = {
  server: {
    secure: false,
    rethinkdb: {
      connections: {
        url: process.env.RETHINKDB_URL || 'rethinkdb://localhost:28015/game_test',
      },
    },
    idm: {
      baseURL: process.env.IDM_BASE_URL || 'http://idm.learnersguild.test',
    },
    crm: {
      baseURL: process.env.CRM_API_BASE_URL || 'http://crm.learnersguild.test',
      key: process.env.CRM_API_KEY || 'this.is.not.a.real.key',
    },
    chat: {
      baseURL: process.env.CHAT_BASE_URL || 'http://chat.learnersguild.test',
      userSecret: process.env.CHAT_API_USER_SECRET || 'chat',
      webhookTokens: {
        DM: process.env.CHAT_API_WEBHOOK_TOKEN_DM || 'whatevs',
      }
    },
    github: {
      baseURL: process.env.GITHUB_BASE_URL || 'http://api.github.test'
    },
    heroku: {
      baseURL: process.env.HEROKU_BASE_URL || 'http://api.github.test'
    },
    jwt: {
      privateKey: process.env.JWT_PRIVATE_KEY || `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA4tX/DJwwrJsPWn9nGPKU9A8veSI+JQY2g/FhM+gdGKwARy1q
JQBsEYuUHlM5CJQPd90Spp90xj3DKsuFxMPwIH4yQbJvryHXtrvgNDniPD5/8hs+
KxaDJDwMjWuDe5QAzmLmg+rA18NDPQK5zJPTqv5qzFlnOYDp67MY/hTEAWR3Ph11
59bMSHyDdxwlkEa43dd8Pt9EuQNq9Eqr4i7qk7HZYYfTGjOBW9vU26MxP0Qv8VaY
LiaXa5PTXc4CwcK/VDYAsX5MXOIPY/CIPHsYtBW47lzRY7Ll7fSUgoJnT0vz8YN4
lgZxYLbIV/qVmgGY3NqukE1DnL0YjcvLquOZMQIDAQABAoIBAA7r0r4qnA0OmiDy
1n5Onru7L/1A4mOfGADv5Nv8PcW8srv74cqTT4iL7O9dvBezXZ0d3rc1MAJGV8s9
3gvGc8o/YuDtculLSZxMmX/1+srJtbLgVeORtIiypoS6+MgtQSxSVyWAULUgtBCU
WFJ7uuW5nJ7alq6yqzCE9HTqOsZ4jJ7dwUqXASWvJ7yYd1EpRb6cgP28sN/LpOcE
rFTJoee6E8F6On/S9PYglpbU1KynwfTOu+ZkOHebwVJGI8PqR2cmCOOc6pSIhLF6
PUSFrIIi+2edEBU/07uHSCfSf2Wmvv6tClX2kr/C9K9X8oxk2gF5Bni43rd3QA3d
xP6yAcECgYEA/FAScTPVH9QyU9qYgNnP/duUv9vFjHnrvj8iikMlavrUpy38pWVc
b6+4FmwWngLKIZMdxR3uLbr3U8aN/8WRtCLzmDC96tFIunbQlTS+YmyK3MQ39XLl
oBI2CHNPH5c104t/qnhLBEpIDBzcqVnRyYDuvdm8QV6kThh8EK6kIlkCgYEA5iac
2oVQXyf29ycpU7yLlFt/oIWuJA6a7c+55VH1zTB4RpidSq6jHyW5KxTn4ElWVKTY
wptY9o5z8antpSgh4dYj0uD2pUZLDTEfT66MIou+jOmRIeAPqgQu6yAV7pOOsevN
eBHrmlFMcd2cS9ZIfVT41GcISHkBuClPzEwtYpkCgYEAuryoaY/rFHuAI/+NDxAl
l8SD+ts1AhraFxuy/JFliB/Mc07dxauXFjH/FNk6hAecgezYA6N7O+08T4yMW9hl
VeToVKL+bGQoZ5i4FzXKEh4zR+ERaV94A1h3FRoCXWcUN1TvT8NoAezYFd7mkZAg
a/o4t9oGMntRL1t/tvkKEUECgYEAs+MKRmJc54M9LQCW9LQyBMtfff/+lIA16Bqs
mejtzmtMFyHCD1Vgej/p8xpsAopPx+jw42q4pj3Bsem3rZcopHPTnEfpgFTo5G64
onczYO0JCuqkXW3b0G9knLJ/cfIzXi2Ic4jONdfFgFpOh5f9ILkBpELD3qF2DpN7
o5sG/kECgYBUWatg88k4Z9+J9JIef5RxHnS2SMkUBKesrv8LzThfDJiEWL+yRCGr
Ll0TQajA3GK9uZ/1mi8UJZ5c7v4FuFVNt89QHIYfATS+RbEbjH7kQwmX42PeDhy7
m6fCH4Bc5omTd4ZplfFexEOp1OpHKIjFbjrfTrfq/VV4jOSPsHUZmA==
-----END RSA PRIVATE KEY-----`,
      publicKey: process.env.JWT_PUBLIC_KEY || `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4tX/DJwwrJsPWn9nGPKU
9A8veSI+JQY2g/FhM+gdGKwARy1qJQBsEYuUHlM5CJQPd90Spp90xj3DKsuFxMPw
IH4yQbJvryHXtrvgNDniPD5/8hs+KxaDJDwMjWuDe5QAzmLmg+rA18NDPQK5zJPT
qv5qzFlnOYDp67MY/hTEAWR3Ph1159bMSHyDdxwlkEa43dd8Pt9EuQNq9Eqr4i7q
k7HZYYfTGjOBW9vU26MxP0Qv8VaYLiaXa5PTXc4CwcK/VDYAsX5MXOIPY/CIPHsY
tBW47lzRY7Ll7fSUgoJnT0vz8YN4lgZxYLbIV/qVmgGY3NqukE1DnL0YjcvLquOZ
MQIDAQAB
-----END PUBLIC KEY-----`
,
    },
  },
}
