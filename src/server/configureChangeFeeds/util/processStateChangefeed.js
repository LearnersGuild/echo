/* eslint-disable no-console, camelcase */
import processChangeFeedWithAutoReconnect from 'rethinkdb-changefeed-reconnect'

import handleConnectionError from './handleConnectionError'

export default function processStateChangefeed(options = {}) {
  const {getFeed, changefeedName} = options
  return processChangeFeedWithAutoReconnect(
    getFeed,
    _getFeedProcessor(options),
    handleConnectionError,
    {changefeedName}
  )
}

function _getFeedProcessor({changefeedName, states, outOfOrderStateTransitions = {}, statesWithExtendedTimeout, queues}) {
  return ({new_val, old_val}) => {
    // if there was no previous value, that means this is a new row
    const previousState = old_val ? old_val.state : '(not yet created)'
    console.log(`[${changefeedName}] state for ${new_val.id} changed from ${previousState} to ${new_val.state}`)
    const queue = queues[new_val.state]

    if (queue) {
      // setting the previous state index to -1 in the case that this is a new row ensures that
      // stateChangeIsInOrder will evaluate to true below
      const previousStateIndex = old_val ? states.indexOf(old_val.state) : -1
      const newStateIndex = states.indexOf(new_val.state)
      const stateChangeIsInOrder = previousStateIndex === newStateIndex - 1
      const outOfOrderStateChangeShouldNotBeIgnored = (outOfOrderStateTransitions[previousState] || []).includes(new_val.state)

      if (stateChangeIsInOrder || outOfOrderStateChangeShouldNotBeIgnored) {
        const useExtendedTimeout = (statesWithExtendedTimeout || []).includes(new_val.state)
        const jobOpts = useExtendedTimeout ? {
          timeout: 60 * 60000
        } : {
          attempts: 3,
          backoff: {type: 'fixed', delay: 10000},
        }
        queue.add(new_val, jobOpts)
      } else {
        console.log('Ignoring out of order state change; job not added to queue')
      }
    }
  }
}
