import {normalize} from 'normalizr'

import {getGraphQLFetcher} from 'src/common/util'
import types from './types'
import schemas from './schemas'
import queries from './queries'

export function deactivateMember(memberId) {
  return {
    types: [
      types.DEACTIVATE_MEMBER_REQUEST,
      types.DEACTIVATE_MEMBER_SUCCESS,
      types.DEACTIVATE_MEMBER_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = queries.deactivateMember(memberId)
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data.deactivateMember)
    },
    redirect: _redirectMember,
    payload: {},
  }
}

export function findMembers() {
  return {
    types: [
      types.FIND_MEMBERS_REQUEST,
      types.FIND_MEMBERS_SUCCESS,
      types.FIND_MEMBERS_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = queries.findMembers()
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data.findMembers)
        .then(members => normalize(members, schemas.members))
    },
    payload: {},
  }
}

export function getMemberSummary(identifier) {
  return {
    types: [
      types.GET_MEMBER_SUMMARY_REQUEST,
      types.GET_MEMBER_SUMMARY_SUCCESS,
      types.GET_MEMBER_SUMMARY_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = queries.getMemberSummary(identifier)
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data.getMemberSummary)
    },
    payload: {},
  }
}

export function reassignMembersToChapter(memberIds, chapterId) {
  return {
    types: [
      types.REASSIGN_MEMBERS_TO_CHAPTER_REQUEST,
      types.REASSIGN_MEMBERS_TO_CHAPTER_SUCCESS,
      types.REASSIGN_MEMBERS_TO_CHAPTER_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const mutation = queries.reassignMembersToChapter(memberIds, chapterId)
      return getGraphQLFetcher(dispatch, getState().auth)(mutation)
        .then(graphQLResponse => graphQLResponse.data.reassignMembersToChapter)
        .then(members => normalize(members, schemas.members))
    },
    redirect: '/members',
    payload: {memberIds, chapterId},
  }
}

export function updateMember(values) {
  return {
    types: [
      types.UPDATE_MEMBER_REQUEST,
      types.UPDATE_MEMBER_SUCCESS,
      types.UPDATE_MEMBER_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const mutation = queries.updateMember(values)
      return getGraphQLFetcher(dispatch, getState().auth)(mutation)
        .then(graphQLResponse => graphQLResponse.data.updateMember)
    },
    redirect: _redirectMember,
    payload: {},
  }
}

function _redirectMember(member) {
  return member && member.handle ? `/members/${member.handle}` : '/members'
}
