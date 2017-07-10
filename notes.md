#server/services/dataService
- new query: changefeedForMemberPhaseChanged. should filter on old_val.phaseId != new_val.phaseId
- example: #server/services/dataService/queries/changefeedForCycleStateChanged.js

#server/configureChangefeeds
- new changefeed listener: memberPhaseChanged. will receive notifications for members already identified as having had a phase change (by query). can pass whole new_value into job queue
- example: server/configureChangefeeds/voteSubmitted.js

#server/workers/
- new worker: memberPhaseChanged
- example: server/workers/cycleCompleted.js

#server/actions/
- new announcement: sendPhaseChangeAnnouncements
- example: server/actions/sendCycleCompleteAnnouncements
