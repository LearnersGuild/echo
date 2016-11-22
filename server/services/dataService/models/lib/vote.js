import {type} from 'thinky'

const {string, date, array, boolean} = type

export default {
  name: 'Vote',
  table: 'votes',
  schema: {
    id: string()
      .uuid(4)
      .required()
      .allowNull(false),

    goals: array()
      .required()
      .allowNull(false),

    pendingValidation: boolean()
      .required()
      .allowNull(false),

    notYetValidatedGoalDescriptors: array()
      .required()
      .allowNull(true)
      .default(null),

    createdAt: date()
      .required()
      .allowNull(false)
      .default(new Date()),

    updatedAt: date()
      .required()
      .allowNull(false)
      .default(new Date()),
  },
  associate: (Vote, models) => {
    Vote.belongsTo(models.Pool, 'pool', 'poolId', 'id', {init: false})
    Vote.belongsTo(models.Player, 'player', 'playerId', 'id', {init: false})
  },
}
