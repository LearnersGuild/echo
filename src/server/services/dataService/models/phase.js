require('require-yaml') // eslint-disable-line import/no-unassigned-import

const PHASES = require('src/data/phases.yaml')

export default function phaseModel(thinky) {
  const {r, type: {string, date, number}} = thinky

  return {
    name: 'Phase',
    table: 'phases',
    schema: {
      id: string()
        .uuid(4)
        .allowNull(false),

      number: number()
        .integer()
        .min(1)
        .allowNull(false),

      name: string()
        .allowNull(false),

      channelName: string()
        .allowNull(false),

      createdAt: date()
        .allowNull(false)
        .default(r.now()),

      updatedAt: date()
        .allowNull(false)
        .default(r.now()),
    },
    associate: (Phase, models) => {
      Phase.hasMany(models.Member, 'members', 'id', 'phaseId', {init: false})
      Phase.hasMany(models.Project, 'projects', 'id', 'phaseId', {init: false})
    },
    static: {
      async syncData() {
        return this.save(PHASES, {conflict: 'replace'})
      },
    },
  }
}
