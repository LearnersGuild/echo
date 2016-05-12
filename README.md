# game

This is the game service.

## Getting Started

Be sure you've read the [instructions for contributing](./CONTRIBUTING.md).

1. Clone the repository.

2. Setup and run [mehserve][mehserve]. Then figure out which port you intend to use and create the mehserve config file:

        $ echo 9005 > ~/.mehserve/game.learnersguild

3. Set your `NODE_ENV` environment variable:

        $ export NODE_ENV=development

4. [Install RethinkDB][install-rethinkdb].

5. Create your `.env` file for your environment. Example:

        PORT=9005
        APP_BASEURL=http://game.learnersguild.dev
        RETHINKDB_URL=rethinkdb://localhost:28015/game_development
        # To support extending JWT sessions:
        IDM_BASE_URL=http://idm.learnersguild.dev
        JWT_PRIVATE_KEY="<get from IDM service>"
        JWT_PUBLIC_KEY="<get from IDM service>"
        REDIS_URL=redis://localhost:6379

6. Run the setup tasks:

        $ npm install
        $ npm run db:create
        $ npm run db:migrate -- up

7. (OPTIONAL) Generate some test data. You'll also need to run this command for your running the [idm][idm] service instance:

        $ IDM_RETHINKDB_URL=rethinkdb://localhost:28015/idm_development npm run dev:testdata


8. Create the test database

        $ RETHINKDB_URL=rethinkdb://localhost:28015/game_test npm run db:create
        $ RETHINKDB_URL=rethinkdb://localhost:28015/game_test npm run db:migrate -- up

9. Run the server:

        $ npm start

10. Visit the server in your browser:

        $ open http://game.learnersguild.dev


## License

See the [LICENSE](./LICENSE) file.


[idm]: https://github.com/LearnersGuild/idm
[github-register-application]: https://github.com/settings/applications/new
[install-rethinkdb]: https://www.rethinkdb.com/docs/install/
[mehserve]: https://github.com/timecounts/mehserve
