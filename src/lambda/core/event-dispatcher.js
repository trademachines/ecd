'use strict';

module.exports.EventDispatcher = class EventDispatcher {
  /**
   * @param {AWS.CloudWatchEvents} cloudwatchEvents
   */
  constructor(cloudwatchEvents) {
    this.cloudwatchEvents = cloudwatchEvents;
  }

  /**
   * @param {object} detail
   * @return {Promise}
   */
  succeeded(detail) {
    return this._dispatch('ECD Service Deployment Started', detail);
  }

  /**
   * @param {string} type
   * @param {object} detail
   * @return {Promise}
   * @private
   */
  _dispatch(type, detail) {
    const entry = {
      Source: 'tm.ecd',
      DetailType: type,
      Detail: JSON.stringify(detail)
    };

    return this.cloudwatchEvents.putEvents({Entries: [entry]}).promise();
  }
};
