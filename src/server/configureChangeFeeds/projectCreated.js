 /* eslint-disable no-console, camelcase */
 import processChangeFeedWithAutoReconnect from 'rethinkdb-changefeed-reconnect'

 import {changefeedForProjectCreated} from 'src/server/services/dataService'
 import {handleConnectionError} from './util'

 export default function projectCreated(projectCreatedQueue) {
   processChangeFeedWithAutoReconnect(changefeedForProjectCreated, _getFeedProcessor(projectCreatedQueue), handleConnectionError, {
     changefeedName: 'project created',
   })
 }

 function _getFeedProcessor(projectCreatedQueue) {
   return ({new_val: project}) => {
     const jobOpts = {
       attempts: 3,
       backoff: {type: 'fixed', delay: 60000},
     }
     projectCreatedQueue.add(project, jobOpts)
   }
 }
