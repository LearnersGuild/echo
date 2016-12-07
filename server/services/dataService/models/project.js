export default function projectModel(thinky) {
  const {r, type: {string, date, array, object}} = thinky

  return {
    name: 'Project',
    table: 'projects',
    schema: {
      id: string()
        .uuid(4)
        .allowNull(false),

      chapterId: string()
        .uuid(4)
        .allowNull(false),

      cycleId: string()
        .uuid(4)
        .allowNull(false),

      name: string()
        .min(1)
        .allowNull(false),

      playerIds: array()
        .allowNull(false),

      projectReviewSurveyId: string()
        .uuid(4),

      retrospectiveSurveyId: string()
        .uuid(4),

      goal: object()
        .allowNull(false)
        .allowExtra(true),

      stats: object()
        .allowExtra(true),

      createdAt: date()
        .allowNull(false)
        .default(r.now()),

      updatedAt: date()
        .allowNull(false)
        .default(r.now()),
    },
    associate: (Project, models) => {
      Project.belongsTo(models.Chapter, 'chapter', 'chapterId', 'id', {init: false})
      Project.belongsTo(models.Cycle, 'cycle', 'cycleId', 'id', {init: false})
      Project.belongsTo(models.Survey, 'projectReviewSurvey', 'projectReviewSurveyId', 'id', {init: false})
      Project.belongsTo(models.Survey, 'retrospectiveSurvey', 'retrospectiveSurveyId', 'id', {init: false})
    },
  }
}
