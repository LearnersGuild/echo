/* eslint-disable no-console, camelcase */
import processChangeFeedWithAutoReconnect from 'rethinkdb-changefeed-reconnect'

import {changefeedForMemberPhaseChanged} from 'src/server/services/dataService'
import {handleConnectionError} from './util'

export default function memberPhaseChanged(memberPhaseChangedQueue) {
  processChangeFeedWithAutoReconnect(
    changefeedForMemberPhaseChanged, _getFeedProcessor(memberPhaseChangedQueue), handleConnectionError,
    {changefeedName: 'phase changed'}
  )
}

function _getFeedProcessor(memberPhaseChangedQueue) {
  return ({new_val: phaseNumber}) => {
    const jobOpts = {
      attempts: 3,
      backoff: {type: 'fixed', delay: 5000},
    }
    memberPhaseChangedQueue.add(phaseNumber, jobOpts)
  }
}
