import { CloudWatchEvents, ECS } from 'aws-sdk';
import { Injectable } from 'injection-js';

@Injectable()
export class FakeS3Sync {
  sync(): Promise<string> {
    return Promise.resolve(`${__dirname}/../ecd-configs`);
  }
}

class FakeAWSService {
  private lastCalls: { [key: string]: any } = {};

  getCall(name: string) {
    return this.lastCalls[name];
  }

  protected call(name: string, p: Promise<any>, params: any) {
    this.lastCalls[name] = params;

    return {
      promise: () => p
    }
  }
}

@Injectable()
export class FakeKMS {
}

@Injectable()
export class FakeECS extends FakeAWSService {
  registerTaskDefinition(params: ECS.RegisterTaskDefinitionRequest) {
    return this.call('registerTaskDefinition', Promise.resolve({
      taskDefinition: {
        taskDefinitionArn: 'arn:aws:ecs:eu-test-1:xxxxxxxxxxxx:task-definition/amazon-ecs-sample:1'
      }
    }), params);
  }

  updateService(params: ECS.Types.UpdateServiceRequest) {
    return this.call('updateService', Promise.resolve({}), params);
  }

}

@Injectable()
export class FakeCloudWatchEvents extends FakeAWSService {
  putEvents(params: CloudWatchEvents.Types.PutEventsRequest) {
    return this.call('putEvents', Promise.resolve({}), params);
  }
}
