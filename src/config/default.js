/* Auto-merged environment-specific configuration. */
module.exports = {
  server: {
    secure: false,
    hotReload: true,
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
      userName: 'echo-bot',
      scimApiURL: 'https://api.slack.com/scim/v1',
      token: process.env.CHAT_API_TOKEN,
      retries: {
        message: 3,
      },
    },
    cli: {
      token: process.env.CLI_COMMAND_TOKEN,
    },
    github: {
      baseURL: 'https://api.github.com',
      tokens: {
        admin: process.env.GITHUB_ORG_ADMIN_TOKEN,
      },
      repos: {
        crafts: 'https://github.com/GuildCraftsTesting/web-development-js-testing',
      },
      organizations: [
        'GuildCrafts',
        'LearnersGuild'
      ],
    },
    heroku: {
      baseURL: 'https://api.heroku.com',
      apiToken: process.env.HEROKU_API_TOKEN,
    },
    aws: {
      s3: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
        region: process.env.AWS_S3_REGION || 'us-west-2',
      },
    },
    goalLibrary: {
      baseURL: process.env.GOAL_LIBRARY_BASE_URL || 'https://curriculum.learnersguild.org',
    },
    curriculum: {
      baseURL: process.env.CURRICULUM_BASE_URL || 'https://curriculum.learnersguild.org',
    },
    guide: {
      baseURL: process.env.GUIDE_BASE_URL || 'https://guide.learnersguild.org',
    },
  },
  app: {
    baseURL: process.env.APP_BASE_URL,
    projectURL: process.env.APP_PROJECT_URL,
    sentryDSN: process.env.SENTRY_CLIENT_DSN,
    playbookURL: process.env.PLAYBOOK_URL || 'https://playbook.learnersguild.org',
    minify: false,
    hotReload: true,
    devTools: true,
    noErrors: true,
  },
  losPermissions: {
    heroku: {
      apps: [
        process.env.HEROKU_APP_NAME_ECHO,
        process.env.HEROKU_APP_NAME_IDM,
      ],
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
