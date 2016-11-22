# Project Formation Algorithm

## How to Test Locally Using Production Data

Setting up your local environment to test the project formation service takes a little bit of up-front work, but has the advantage of allowing you to see _actual_ results based on _real_ data from our learners.

**NOTE: DO NOT just cut-and-paste the commands / queries below into your local shell or RethinkDB console. You'll need to tweak the commands / queries for your own environment. YOU HAVE BEEN WARNED.**

Here are the steps:

1. Load the production data.
2. Restart your services and workers.
3. Prepare your local environment to run the algorithm.
4. Launch the cycle.


### Loading Production Data

You can use the [resyncdb script](https://github.com/LearnersGuild/bin/blob/master/resyncdb) to get a copy of the production data locally.

```bash
./resyncdb -v lg-game game_prod_copy
./resyncdb -v lg-idm idm_prod_copy
```


### (Re-)start Your Services and Workers

After you've modified your idm `.env.development` RETHINKDB_URL with `idm_prod_copy`:

```
# idm
$ cd ~/dev/learnersguild/idm
$ npm start
```

After you've modified your game `.env.development` RETHINKDB_URL with `game_prod_copy`:

```
# game
$ cd ~/dev/learnersguild/game
$ npm start

# game (cycle launched worker)
$ cd ~/dev/learnersguild/game
$ npm run workers:cycleLaunched
```


### Prepare Your Local Environment

#### Find a Cycle For Testing

First, you need to determine _which_ recent cycle from the production data you'd like to use. **You need to choose a cycle that has a full set of associated player votes with it.** You can get a sense of which cycle might be good to use for testing with something like the following query:

```
r.db('game_prod_copy')
  .table('cycles')
  .orderBy(r.desc('cycleNumber'))
  .map(row => ({
    cycleId: row('id'),
    chapterId: row('chapterId'),
    cycleNumber: row('cycleNumber'),
    numVotes: r.db('game_prod_copy').table('votes')
      .filter(
        vote => r.db('game_prod_copy').table('pools').get(vote('poolId'))('cycleId').eq(row('id'))
      )
      .count(),
    voteTimestampCutoff: r.db('game_prod_copy').table('votes')
      .eqJoin('poolId', r.db('game_prod_copy').table('pools'))
      .filter(join => join('right')('cycleId').eq(row('id')))
      .map(row => row('left'))
      .orderBy(r.desc('updatedAt'))
      .nth(0)('updatedAt')
        }))
```

#### Delete Irrelevant Cycles and Votes

Now you should delete any newer cycles and any votes associated with the newer cycles:

##### Cycles

```
r.db('game_prod_copy')
  .table('cycles')
  .filter(row => row('cycleNumber').gt(<CYCLE_NUMBER_FOR_TESTING>))
  .delete()
```

##### Votes

```
r.db('game_prod_copy')
  .table('votes')
  .filter(row => row('createdAt').gt(<VOTE_TIMESTAMP_CUTOFF_FROM_PREVIOUS_QUERY>))
  .delete()
```

#### Prepare the Current Cycle

Now you need to prepare the current cycle by putting it into the `GOAL_SELECTION` state and deleting any previously-created projects associated with it:

```
r.db('game_prod_copy').table('cycles')
  .filter({chapterId: '<CHAPTER_ID_FOR_TEST_CYCLE>'})
  .filter(p => p('cycleNumber').eq(<CYCLE_NUMBER_FOR_TESTING>)).nth(0)
  .do(cycle => r.and(
    r.db('game_prod_copy').table('cycles').get(cycle('id')).update({state: 'GOAL_SELECTION'})
    ,
    r.db('game_prod_copy').table('projects')
      .filter({chapterId: '<CHAPTER_ID_FOR_TEST_CYCLE>'})
      .filter(p => p('cycleId').eq(cycle('id'))
  )
  .delete()
))
```

#### Ensure You Are a Player and a Moderator

First, you'll need to find your user ID from the IDM database:

```
r.db('idm_prod_copy')
  .table('users')
  .filter({handle: 'jeffreywescott'})
	.pluck('id', 'handle', 'name')
```

Then, you need to ensure that there is a row in both the `players` and `moderators` table for the given chapter:

##### Player

```
r.db('game_prod_copy')
  .table('players')
  .get('<YOUR_USER_ID_FROM_IDM>')
  .replace(row => row.without('chapterId').merge({chapterId: '<CHAPTER_ID_FOR_TEST_CYCLE>'}))
```

##### Moderator

```
r.db('game_prod_copy')
  .table('moderators')
  .get('<YOUR_USER_ID_FROM_IDM>')
  .replace(row => row.without('chapterId').merge({chapterId: '<CHAPTER_ID_FOR_TEST_CYCLE>'}))
```

#### Set up Your `~/.lgrc` File

Rather than launching your local `echo` (Rocket.Chat) instance, which would require you to delete any existing user account associated with your GitHub handle, you can use the `game-cli` `npm run command` script to launch the cycle. Before you do that, though, you need to make sure you have a valid `~/.lgrc` file.

[You can find the instructions to set that up here.][game-cli-lgrc]


### Launch the Cycle

Now you can launch the cycle:

```
$ cd ~/dev/learnersguild/game-cli
$ npm run command -- cycle launch
```

At this point, you should see the output of the algorithm running in the console associated with your `npm run workers:cycleLaunched` game command (see above). **WARNING: It takes a while to run.**

Enjoy!

<!-- external resources -->

[idm-backups]: https://app.compose.io/learners-guild-ltd/deployments/lg-idm/backups
[game-backups]: https://app.compose.io/learners-guild-ltd/deployments/lg-game/backups
[game-cli-lgrc]: https://github.com/LearnersGuild/game-cli#the-command-runner
