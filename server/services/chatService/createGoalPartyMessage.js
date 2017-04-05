import {apiFetch} from './util'

export default function createGoalPartyMessage(users) {
  console.log('Am I getting users?', users)
  return apiFetch('/api/mpim.open', {
    method: 'POST',
    users: users
  })
  .then(result => {
    console.log('do I get a result?', result.users)
    return result.users
  })
}
