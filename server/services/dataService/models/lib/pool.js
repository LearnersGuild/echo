import {type} from 'thinky'

const {string, date} = type

export default {
  name: 'Pool',
  table: 'pools',
  schema: {
    id: string()
      .uuid(4)
      .allowNull(false),

    cycleId: string()
      .uuid(4)
      .allowNull(false),

    name: string()
      .required()
      .allowNull(false),

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
    Vote.belongsTo(models.Cycle, 'cycle', 'cycleId', 'id', {init: false})
  },
}
