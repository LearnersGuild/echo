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

##### 4. As explained in the installation instructions for IDM, ensure that your `NODE_ENV` environment variable has the value `development`.

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

##### 9. Make sure that RethinkDB is still running:

```bash
brew services list
```

If it is no longer running, run it:

```bash
brew services run rethinkdb
```


##### 10. Create development & test databases:

```bash
npm run db:create
NODE_ENV=test npm run db:create
```

```bash
npm run db:migrate:up
NODE_ENV=test npm run db:migrate:up
```

Optionally, seed your development database with test member and project data representing one of the possible states of the system. In the command below, replace `<STATE>` with any one of these:

- `GOAL_SELECTION` (default)
- `GOAL_SELECTION_VOTES`
- `PRACTICE`
- `REFLECTION`

```bash
npm run db:copy -- <STATE>
```

### RUNNING THE SERVER

Make sure that the following services are **all** running:

- mehserve(see above)
- RethinkDB (see above)
- [idm][idm] (in your `idm` directory, enter `npm start`)

Then start the `echo` service:

```bash
npm start
```

Visit the server in your browser and sign in with Github:

```bash
http://echo.learnersguild.dev
```

You should then see a display of phases, with options to choose projects or users. In a new terminal tab (with NODE_ENV set to development as always), start the workers and leave them running. This requires two different terminal tabs, one for each.

```bash
npm run workers
npm run workers:cycleLaunched
```

You should expect to see an error message caused by your `.env.development` file not containing two required entries for CHAT_BASE_URL and CHAT_API_TOKEN. Your work will not be affected by this error, so you may disregard it.

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
