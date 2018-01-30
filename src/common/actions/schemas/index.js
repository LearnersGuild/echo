import {Schema, arrayOf} from 'normalizr'

const chapter = new Schema('chapters')
const phase = new Schema('phases')
const member = new Schema('members')
const project = new Schema('projects')
const user = new Schema('users')

const chapters = arrayOf(chapter)
const phases = arrayOf(phase)
const members = arrayOf(member)
const projects = arrayOf(project)
const users = arrayOf(user)

member.define({chapter})

export default {
  chapter,
  chapters,
  phase,
  phases,
  member,
  members,
  project,
  projects,
  user,
  users,
}
