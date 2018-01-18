import r from '../r'
import {customQueryError} from '../util'

const surveysBlueprintsTable = r.table('surveyBlueprints')

export default function getSurveyBlueprintByDescriptor(descriptor) {
  // FIXME: should be instead rejected with an easily identifiable DocumentNotFound error
  return surveysBlueprintsTable.getAll(descriptor, {index: 'descriptor'})
    .nth(0)
    .default(customQueryError(`No Survey Blueprint found with descriptor ${descriptor}`))
}
