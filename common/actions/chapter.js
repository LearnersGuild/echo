import {normalize} from 'normalizr'

import {getGraphQLFetcher} from 'src/common/util'
import types from './types'
import schemas from './schemas'
import queries from './queries'

export function findChapters() {
  return {
    types: [
      types.FIND_CHAPTERS_REQUEST,
      types.FIND_CHAPTERS_SUCCESS,
      types.FIND_CHAPTERS_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = queries.getAllChapters()
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data.getAllChapters)
        .then(chapters => normalize(chapters, schemas.chapters))
    },
    payload: {},
  }
}

export function getChapter(id) {
  return {
    types: [
      types.GET_CHAPTER_REQUEST,
      types.GET_CHAPTER_SUCCESS,
      types.GET_CHAPTER_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = queries.getChapterById(id)
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data.getChapterById)
        .then(chapter => normalize(chapter, schemas.chapter))
    },
    payload: {id},
  }
}

export function saveChapter(chapter) {
  const {cycleEpochDate, cycleEpochTime} = chapter
  const cycleEpoch = new Date(cycleEpochDate)
  cycleEpoch.setUTCHours(cycleEpochTime.getUTCHours())
  cycleEpoch.setUTCMinutes(cycleEpochTime.getUTCMinutes())
  cycleEpoch.setUTCSeconds(0)
  cycleEpoch.setUTCMilliseconds(0)
  const chapterData = Object.assign({}, chapter, {cycleEpoch})
  delete chapterData.cycleEpochDate
  delete chapterData.cycleEpochTime

  return {
    types: [
      types.SAVE_CHAPTER_REQUEST,
      types.SAVE_CHAPTER_SUCCESS,
      types.SAVE_CHAPTER_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const mutation = queries.createOrUpdateChapter(chapterData)
      return getGraphQLFetcher(dispatch, getState().auth)(mutation)
        .then(graphQLResponse => graphQLResponse.data.createOrUpdateChapter)
        .then(chapter => normalize(chapter, schemas.chapter))
    },
    redirect: '/chapters',
    payload: {chapter},
  }
}

export function addInviteCodeToChapter(id, inviteCodeData) {
  // because invite codes are (rightfully) stored on the IDM service, we need to
  // first create the invite code there, then associate it with the chapter in
  // the game service
  return {
    types: [
      types.ADD_INVITE_CODE_TO_CHAPTER_REQUEST,
      types.ADD_INVITE_CODE_TO_CHAPTER_SUCCESS,
      types.ADD_INVITE_CODE_TO_CHAPTER_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const {auth, chapters: {chapters}} = getState()
      const chapter = chapters[id]
      if (!chapter) {
        throw new Error("Can't add invite code to chapter before it's loaded!")
      }

      return createInviteCode(dispatch, auth, inviteCodeData)
        .then(inviteCode => {
          const chapterInviteCodes = (chapter.inviteCodes || []).concat([inviteCode.code])
          const chapterData = Object.assign({}, chapter, {inviteCodes: chapterInviteCodes})
          const mutation = queries.createOrUpdateChapter(chapterData)
          return getGraphQLFetcher(dispatch, auth)(mutation)
            .then(graphQLResponse => graphQLResponse.data.createOrUpdateChapter)
            .then(chapter => normalize(chapter, schemas.chapter))
        })
    },
    redirect: `/chapters/${id}`,
    payload: {id, inviteCodeData},
  }
}

function createInviteCode(dispatch, auth, inviteCode) {
  const mutation = queries.createInviteCode(inviteCode)
  return getGraphQLFetcher(dispatch, auth, process.env.IDM_BASE_URL)(mutation)
    .then(graphQLResponse => graphQLResponse.data.createInviteCode)
}
