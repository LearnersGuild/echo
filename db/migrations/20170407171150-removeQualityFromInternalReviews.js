const QUALITY_QUESTION_ID = '2c335ce5-ed0b-4068-92c8-56666fb7fdad'

exports.up = async function (r) {
  return r.table('surveys')
    .update(survey => ({
      questionRefs: survey('questionRefs').filter(_ => _('questionId').ne(QUALITY_QUESTION_ID))
    }))
}

exports.down = function () {
 // no way to revert this change
}
