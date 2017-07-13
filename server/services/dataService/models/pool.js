export default function poolModel(thinky) {
  const {r, type: {string, date}} = thinky

  return {
    name: 'Pool',
    table: 'pools',
    schema: {
      id: string()
        .uuid(4)
        .allowNull(false),

      cycleId: string()
        .uuid(4)
        .allowNull(false),

      phaseId: string()
        .uuid(4)
        .allowNull(false),

      name: string()
        .allowNull(false),

      createdAt: date()
        .allowNull(false)
        .default(r.now()),

      updatedAt: date()
        .allowNull(false)
        .default(r.now()),
    },
    associate: (Pool, models) => {
      Pool.belongsTo(models.Cycle, 'cycle', 'cycleId', 'id', {init: false})
      Pool.belongsTo(models.Phase, 'phase', 'phaseId', 'id', {init: false})
    },
  }
}
