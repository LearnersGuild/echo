import r from '../r'

export default function changefeedForProjectCreated() {
  return r.table('projects').changes()
    .filter(r.row('old_val').eq(null))
}
