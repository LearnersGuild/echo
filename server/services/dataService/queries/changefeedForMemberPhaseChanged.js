import r from '../r'

export default function changefeedForMemberPhaseChanged() {
  return r.table('phases').changes()
    .filter(
      r.row('old_val')('phaseId').ne(r.row('new_val')('phaseId')) // phase id changes
    )
}
