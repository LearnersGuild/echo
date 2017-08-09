import {Member, Phase} from 'src/server/services/dataService'

export default async function updateMember(values) {
  // FIXME: why does this only update the phase number??
  const phaseNumber = values.phaseNumber
  const phase = phaseNumber ? await Phase.filter({number: phaseNumber}).nth(0) : {id: null}
  return Member.get(values.id).update({phaseId: phase.id})
}
