const QUALITY_QUESTION_ID = '2c335ce5-ed0b-4068-92c8-56666fb7fdad'
const QUALITY_STAT_ID = '837609de-cf2b-4be3-aff2-a7fc2d5ba616'

exports.up = async function (r) {
  await _removeQualityQuestionFromSurveys(r)
  await _removeQualityResponses(r)
  await _removeQualityQuestion(r)
  await _removeQualityStat(r)
}

exports.down = function () {
 // no way to revert this change here, although
 // question and stat can be restored by reverting
 // the data files
}

async function _removeQualityQuestionFromSurveys(r) {
  const projectReviewSurveyIds = await r.table('projects')
   .eqJoin('projectReviewSurveyId', r.table('surveys'))
   .map(_ => _('right'))('id')

  await r.table('surveys').getAll(...projectReviewSurveyIds)
    .update(survey => ({
      questionRefs: survey('questionRefs').filter(_ => _('name').eq('completeness'))
    }))
}

async function _removeQualityResponses(r) {
  await r.table('responses')
    .filter({questionId: QUALITY_QUESTION_ID})
    .delete()
}

async function _removeQualityStat(r) {
  await r.table('stats')
    .get(QUALITY_STAT_ID)
    .delete()
}

async function _removeQualityQuestion(r) {
  await r.table('questions')
    .get(QUALITY_QUESTION_ID)
    .delete()
}
