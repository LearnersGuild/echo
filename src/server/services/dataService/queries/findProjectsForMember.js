import r from '../r'

export default function findProjectsForMember(memberId) {
  return r.table('projects').filter(project => (project('memberIds').contains(memberId)))
}
