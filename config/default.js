/* Auto-merged environment-specific configuration. */
module.exports = {
  server: {
    secure: false,
    port: process.env.PORT || '9005',
    baseURL: process.env.APP_BASE_URL,
    sentryDSN: process.env.SENTRY_SERVER_DSN,
    rethinkdb: {
      connections: {
        url: process.env.RETHINKDB_URL,
        cert: process.env.RETHINKDB_CERT,
      },
      tableCreation: {
        replicas: 1,
      },
    },
    redis: {
      url: process.env.REDIS_URL,
    },
    jwt: {
      privateKey: process.env.JWT_PRIVATE_KEY,
      publicKey: process.env.JWT_PUBLIC_KEY,
      algorithm: 'RS512',
    },
    newrelic: {
      enabled: false,
    },
    sockets: {
      host: null,
    },
    idm: {
      baseURL: process.env.IDM_BASE_URL,
    },
    graphiql: {
      baseURL: process.env.GRAPHIQL_BASE_URL,
    },
    crm: {
      enabled: false,
      baseURL: process.env.CRM_API_BASE_URL,
      key: process.env.CRM_API_KEY,
    },
    chat: {
      baseURL: process.env.CHAT_BASE_URL,
      userSecret: process.env.CHAT_API_USER_SECRET,
      webhookTokens: {
        DM: process.env.CHAT_API_WEBHOOK_TOKEN_DM,
      },
      retries: {
        message: 5,
      },
    },
    github: {
      tokens: {
        admin: process.env.GITHUB_ORG_ADMIN_TOKEN,
      },
      repos: {
        crafts: process.env.GITHUB_CRAFTS_REPO,
      }
    },
  },

  app: {
    baseURL: process.env.APP_BASE_URL,
    sentryDSN: process.env.SENTRY_CLIENT_DSN,
    playbookURL: process.env.PLAYBOOK_URL || 'https://playbook.learnersguild.org',
    minify: false,
    hotReload: true,
    devTools: true,
    noErrors: true,
  },
}
