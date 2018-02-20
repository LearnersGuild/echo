# echo

[ ![Codeship Status for LearnersGuild/echo](https://codeship.com/projects/8ee1a1d0-17e4-0134-1d69-2a776fb5d411/status?branch=master)](https://codeship.com/projects/158610)
[![Code Climate GPA](https://codeclimate.com/github/LearnersGuild/echo/badges/gpa.svg)](https://codeclimate.com/github/LearnersGuild/echo/feed)
[![Code Climate Issue Count](https://codeclimate.com/github/LearnersGuild/echo/badges/issue_count.svg)](https://codeclimate.com/github/LearnersGuild/echo)
[![Test Coverage](https://codeclimate.com/github/LearnersGuild/echo/badges/coverage.svg)](https://codeclimate.com/github/LearnersGuild/echo/coverage)

This is the echo service.

## GETTING STARTED

Welcome to [Echo](http://i.giphy.com/MGU6B1h1jSfja.gif).

Before you can run echo you need:
- To install and set up the [IDM service](https://github.com/LearnersGuild/idm)

### SETTING UP THE ECHO SERVICE

##### 1. **Globally** install [nvm][nvm], [avn][avn], and [avn-nvm][avn-nvm].

```bash
curl -o- https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
npm install -g avn avn-nvm
avn setup
```

##### 2. Fork and clone the repository.

##### 3. Setup and run [mehserve][mehserve].

Figure out which port you intend to use and create the mehserve config file:
```bash
echo 9005 > ~/.mehserve/echo.learnersguild
```

##### 4. Set your `NODE_ENV` environment variable:

```bash
export NODE_ENV=development
```

##### 5. [Install RethinkDB][install-rethinkdb].

##### 6. Create a free AWS account:
[https://aws.amazon.com](https://aws.amazon.com/)

Make a copy of your access key ID and secret access key. You'll need to include these in your  environment variables in the next step.

##### 7. Create your `.env.development` file for your environment.
Take out all comments in your final version.
Example:
```
PORT=9005
APP_BASE_URL=http://echo.learnersguild.meh
APP_PROJECT_URL=http://echo.learnersguild.meh/projects
REDIS_URL=redis://localhost:6379
RETHINKDB_URL=rethinkdb://localhost:28015/echo_development
# IDM / JWT settings, including session extension
IDM_BASE_URL=http://idm.learnersguild.meh
JWT_PRIVATE_KEY="<get from IDM service>"
JWT_PUBLIC_KEY="<get from IDM service>"
# External API settings
GITHUB_CRAFTS_REPO="https://github.com/GuildCraftsTesting/web-development-js-testing"
S3_BUCKET=guild-development
S3_KEY_PREFIX=db
AWS_ACCESS_KEY_ID=<YOUR_AWS_ACCESS_KEY_ID>
AWS_SECRET_ACCESS_KEY=<YOUR_AWS_SECRET_ACCESS_KEY>
```

##### 8. Install dependencies:

```bash
npm install
```

##### 9. Create a development & test databases:

```bash
npm run db:create
NODE_ENV=test npm run db:create
```

```bash
npm run db:migrate:up
NODE_ENV=test npm run db:migrate:up
```

Optionally, seed your development database with test member and project data:
```bash
npm run db:copy -- <STATE>
```

Available `STATE` options:
- `PRACTICE`
- `REFLECTION`

### RUNNING THE SERVER

**NOTE:** you'll need rethinkdb, [mehserve][mehserve], [idm][idm] and this server all running at the same time for things to work.

```bash
npm start
```

Visit the server in your browser:

```bash
open http://echo.learnersguild.meh
```

Start the workers
**NOTE:** you'll need to start redis for the workers to run correctly.

```bash
npm run workers
npm run workers:cycleLaunched
```

### USING THE DEV SLACK INSTANCE WITH YOUR LOCAL ECHO SERVICE

##### 1. Join the dev Slack team by requesting (and accepting) an invitation from a teammate.

##### 2. Configure your dev environment for OUTBOUND calls _to_ the Slack API.

Add the following to your `.env.development`:
```
# Slack / command CLI settings
CHAT_BASE_URL=https://slack.com
CHAT_API_TOKEN=<the Slack bot user's OAuth access token. obtain from a teammate or in the Slack team's app settings>
```

##### 3. Configure your dev environment for INBOUND calls _from_ Slack (for /slash commands).

Add the following to your `.env.development`:
```
CLI_COMMAND_TOKEN=<the Slack app's verification token. obtain from a teammate or in the Slack team's app settings>
```

##### 4. Set up localtunnel and run the `slackslash` script:

```bash
npm install -g localtunnel
npm run slackslash
```

**NOTE:** You can ignore this message after starting localtunnel:
```
your url is: https://slackslash.localtunnel.me
```
It's not a URL you're meant to visit in the browser directly; it is the URL already configured in the dev Slack team's echo app and where incoming requests for /slash commands are sent. With localtunnel running and configured properly (along with `echo`, `idm` and `mehserve`), when you issue a slash command in a channel in the dev Slack team, the request will be sent to https://slackslash.localtunnel.me and served by the echo service running on your local machine.

## CONTINUOUS INTEGRATION

We use [Codeship](https://codeship.com/) for continuous integration. The following files are responsible for CI configuration:

- `Dockerfile`: basic Docker image for the app
- `codeship-services.yml`: similar to `docker-compose.yml`, but for CI
- `codeship-steps.yml`: the steps to run on each service for CI
- `app.env.encrypted`: encrypted environment vars for the app (e.g., `NPM_AUTH_TOKEN`)


## LICENSE

See the [LICENSE](./LICENSE) file.


[idm]: https://github.com/LearnersGuild/idm
[github-register-application]: https://github.com/settings/applications/new
[install-rethinkdb]: https://www.rethinkdb.com/docs/install/
[mehserve]: https://github.com/timecounts/mehserve
[nvm]: https://github.com/creationix/nvm
[avn]: https://github.com/wbyoung/avn
[avn-nvm]: https://github.com/wbyoung/avn-nvm
