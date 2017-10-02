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

##### 1. When you installed IDM (or earlier), you globally installed [nvm][nvm], [avn][avn], [avn-nvm][avn-nvm], [mehserve][mehserve], and [RethinkDB][rethinkdb], and created a free AWS account.

The echo service, too, depends on them.

##### 2. Fork and clone this (echo) repository.

##### 3. Figure out which port you intend to use for mehserve, then create the mehserve config file, and finally run [mehserve][mehserve].

```bash
echo 9005 > ~/.mehserve/echo.learnersguild
mehserve run
```

##### 4. Set your `NODE_ENV` environment variable. Warning: This setting is not persistent. If you open another terminal window for any subsequent commands, repeat this command there before entering other commands.

```bash
export NODE_ENV=development
```

##### 5. Find your AWS access key ID and secret access key in the `.env.development` file in your IDM development project directory. You'll need to include these in your  environment variables in the next step.

##### 6. Create the `.env.development` file for your environment.
Take out all comments in your final version.
Example:
```
PORT=9005
APP_BASE_URL=http://echo.learnersguild.dev
REDIS_URL=redis://localhost:6379
RETHINKDB_URL=rethinkdb://localhost:28015/echo_development
# IDM / JWT settings, including session extension
IDM_BASE_URL=http://idm.learnersguild.dev
JWT_PRIVATE_KEY="<get from .env.development file in your IDM directory>"
JWT_PUBLIC_KEY="<get from .env.development file in your IDM directory>"
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

##### 9. Create development & test databases:

```bash
npm run db:create
NODE_ENV=test npm run db:create
```

```bash
npm run db:migrate:up
NODE_ENV=test npm run db:migrate:up
```

Optionally, seed your development database with test member and project data. In the command below, replace `<STATE>` with any of these:

- `GOAL_SELECTION` (default)
- `GOAL_SELECTION_VOTES`
- `PRACTICE`
- `REFLECTION`

```bash
npm run db:copy -- <STATE>
```

### RUNNING THE SERVER

**NOTE:** You'll need [mehserve][mehserve], [idm][idm] and this server all running at the same time for things to work.

```bash
npm start
```

Visit the server in your browser and sign in with Github:

```bash
open http://echo.learnersguild.dev
```

You should then see a display of phases, with options to choose projects or users. In a new terminal tab (with NODE_ENV set to development as always), start the workers:

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
CHAT_API_TOKEN=<the Slack bot user's OAuth access token; obtain from a teammate or in the Slack team's app settings>
```

##### 3. Configure your dev environment for INBOUND calls _from_ Slack (for /slash commands).

Add the following to your `.env.development`:
```
CLI_COMMAND_TOKEN=<the Slack app's verification token; obtain from a teammate or in the Slack team's app settings>
```

##### 4. Set up localtunnel and run the `slackslash` script:

```bash
npm install -g localtunnel
npm run slackslash
```

**NOTE:** You should see the following message after starting localtunnel:
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
[rethinkdb]: https://www.rethinkdb.com/docs
[mehserve]: https://github.com/timecounts/mehserve
[nvm]: https://github.com/creationix/nvm
[avn]: https://github.com/wbyoung/avn
[avn-nvm]: https://github.com/wbyoung/avn-nvm
