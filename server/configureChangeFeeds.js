/* eslint-disable no-console, camelcase */
import r from '../db/connect'
import {getQueue} from './util'

function newChapters() {
  const newChapterQueue = getQueue('newChapter')

  r.table('chapters').changes().filter(r.row('old_val').eq(null))
    .then(cursor => {
      cursor.each((err, {new_val: chapter}) => {
        if (!err) {
          console.log('adding new chapter to newChapter queue:', chapter)
          newChapterQueue.add(chapter)
        }
      })
    })
}

function newOrUpdatedVotes() {
  const newOrUpdatedVoteQueue = getQueue('newOrUpdatedVote')

  // votes without githubIssue information are either new or updated
  r.table('votes').changes()
    .filter(r.row('new_val')('goals').filter(goal => goal.hasFields(['githubIssue']).not()).count().gt(0))
    .then(cursor => {
      cursor.each((err, {new_val: vote}) => {
        if (!err) {
          // console.log('adding vote to vote queue:', vote)
          newOrUpdatedVoteQueue.add(vote)
        }
      })
    })
}

export default function configureChangeFeeds() {
  newChapters()
  newOrUpdatedVotes()
}
