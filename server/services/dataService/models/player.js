
export default function playerModel(thinky) {
  const {r, type: {string, date, object}} = thinky

  return {
    name: 'Player',
    table: 'players',
    schema: {
      id: string()
        .uuid(4)
        .allowNull(false),

      chapterId: string()
        .uuid(4)
        .allowNull(false),

      stats: object()
        .allowExtra(true),

      createdAt: date()
        .allowNull(false)
        .default(r.now()),

      updatedAt: date()
        .allowNull(false)
        .default(r.now()),
    },
    associate: (Player, models) => {
      Player.belongsTo(models.Chapter, 'chapter', 'chapterId', 'id', {init: false})
    },
  }
}
