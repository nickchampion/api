class Base {
  #indexName
  #collectionName

  constructor(indexName, collectionName) {
    if (this.constructor == Base)
      throw new Error("Abstract Base class can't be instantiated.");

    this.#indexName = indexName;
    this.#collectionName = collectionName || indexName;
  }

  merge(model, source) {
    if (!source) return;

    for (const key of Object.keys(source)) {
      if (model.hasOwnProperty(key)) model[key] = source[key];
    }
  }

  getIndexName() {
    return this.#indexName;
  }

  getId(id) {
    return id.indexOf('/') === -1 ? `${this.#collectionName}/${id}` : id;
  }
}

module.exports = Base;
