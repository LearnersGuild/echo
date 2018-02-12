export default function projectModel(thinky) {
  const {r, type: {string, date, array}} = thinky

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

      phaseId: string()
        .uuid(4)
        .allowNull(true),

      name: string()
        .min(1)
        .allowNull(false),

      memberIds: array()
        .allowNull(false),

      retrospectiveSurveyId: string()
        .uuid(4),

      workPlanSurveyId: string()
        .uuid(4),

      artifactURL: string()
        .min(1),

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
      Project.belongsTo(models.Phase, 'phase', 'phaseId', 'id', {init: false})
      Project.belongsTo(models.Survey, 'retrospectiveSurvey', 'retrospectiveSurveyId', 'id', {init: false})
    },
  }
}
