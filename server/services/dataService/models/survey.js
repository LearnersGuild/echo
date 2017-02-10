export default function surveyModel(thinky) {
  const {r, type: {string, date, array}} = thinky

  return {
    name: 'Survey',
    table: 'surveys',
    schema: {
      id: string()
        .uuid(4)
        .required()
        .allowNull(false),

      completedBy: array()
        .required()
        .allowNull(false),

      unlockedFor: array()
        .allowNull(false)
        .default([]),

      questionRefs: array()
        .required()
        .allowNull(false),

      createdAt: date()
        .allowNull(false)
        .default(r.now()),

      updatedAt: date()
        .allowNull(false)
        .default(r.now()),

    },
    associate: (Survey, models) => {
      Survey.hasMany(models.Question, 'questions', 'id', 'surveyId', {init: false})
    },
  }
}
