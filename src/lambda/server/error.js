/**
 */
class ApplicationError extends Error {
  /**
   * @param {string} msg
   * @param {*} details
   */
  constructor(msg, details) {
    super(msg);
    this.details = details;
  }
}

module.exports.ApplicationError = ApplicationError;
