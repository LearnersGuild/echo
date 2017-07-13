import r from '../r'

export default function changefeedForMemberPhaseChanged() {
  return r.table('members').changes()
    .filter(
      // phase id changes
      r.row('old_val')('phaseId').default(null)
        .ne(
          r.row('new_val')('phaseId').default(null)
        )
    )
}
