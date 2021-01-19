class ContextualError extends Error {
  constructor(name, message, metadata = {}) {
    super(JSON.stringify(message))
    this.name = name
    this.metadata = metadata
  }
}

exports.ContextualError = ContextualError
