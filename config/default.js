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
      userName: 'echo',
      userSecret: process.env.CHAT_API_USER_SECRET,
      webhookTokens: {
        DM: process.env.CHAT_API_WEBHOOK_TOKEN_DM,
      },
      retries: {
        message: 3,
      },
    },
    github: {
      baseURL: 'https://api.github.com',
      tokens: {
        admin: process.env.GITHUB_ORG_ADMIN_TOKEN,
      },
      repos: {
        crafts: process.env.GITHUB_CRAFTS_REPO,
      }
    },
    heroku: {
      baseURL: 'https://api.heroku.com',
      apiToken: process.env.HEROKU_API_TOKEN,
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
  levels: {
    permissions: {
      3: {
        github: {
          repositories: [
            'LearnersGuild/idm',
          ],
        },
      },
      4: {
        github: {
          repositories: [
            'LearnersGuild/bin',
            'LearnersGuild/echo-chat',
            'LearnersGuild/game',
            'LearnersGuild/game-cli',
            'LearnersGuild/graphiql',
            'LearnersGuild/idm',
            'LearnersGuild/idm-jwt-auth',
            'LearnersGuild/rethinkdb-changefeed-reconnect',
            'LearnersGuild/subcli',
          ],
        },
        heroku: {
          apps: [
            'lg-game',
            'lg-idm',
          ],
        },
      },
    },
  },
  smtp: {
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    port: process.env.SMTP_PORT,
    host: process.env.SMTP_HOST,
  },
  reports: {
    projectTeams: {
      email: process.env.PROJECT_TEAMS_REPORT_EMAIL
    }
  }
}
