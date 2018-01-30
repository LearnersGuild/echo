require('require-yaml') // eslint-disable-line import/no-unassigned-import

const PHASES = require('src/data/phases.yaml')

export default function phaseModel(thinky) {
  const {r, type: {string, date, number, boolean}} = thinky

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

      hasVoting: boolean()
        .allowNull(false)
        .default(false),

      hasRetrospective: boolean()
        .allowNull(false)
        .default(false),

      practiceGoalNumber: number() // workaround for the goal service API not having a search feature.
        .integer()
        .allowNull(true),

      interviewGoalNumber: number() // workaround for the goal service API not having a search feature.
        .integer()
        .allowNull(true),

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
