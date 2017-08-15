import { CloudWatchEvents } from 'aws-sdk';
import { Injectable } from 'injection-js';

@Injectable()
export class EventDispatcher {
  constructor(private cloudwatchEvents: CloudWatchEvents) {
  }

  succeeded(detail: any) {
    return this.dispatch('ECD Service Deployment Started', detail);
  }

  private dispatch(type: string, detail: any) {
    const entry = {
      Source: 'tm.ecd',
      DetailType: type,
      Detail: JSON.stringify(detail)
    };

    return this.cloudwatchEvents.putEvents({ Entries: [entry] }).promise();
  }
}
