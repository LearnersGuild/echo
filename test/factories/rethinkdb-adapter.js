const RethinkDBAdapter = function () {}

RethinkDBAdapter.prototype.build = (Model, attributes) => {
  return attributes
}

RethinkDBAdapter.prototype.save = (doc, Model, callback) => {
  Model.insert(doc).run()
    .then(() => callback())
    .catch(e => callback(e))
}

RethinkDBAdapter.prototype.destroy = (doc, Model, callback) => {
  Model.get(doc.id).delete().run()
    .then(() => callback())
    .catch(e => callback(e))
}

export default RethinkDBAdapter
