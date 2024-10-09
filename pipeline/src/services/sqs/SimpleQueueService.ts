import { SQSClient, SendMessageCommand, MessageAttributeValue } from "@aws-sdk/client-sqs";
import { Logger } from "../../utilities/logger/Logger";

const { SQS_URL, SQS_ENDPOINT, SQS_DEFAULT_DELAY_SECONDS, DISABLE_SQS, REGION } = process.env;

const sqs = new SQSClient({
  region: REGION,
  endpoint: SQS_ENDPOINT,
  credentials: SQS_ENDPOINT ? {
    accessKeyId: "local",
    secretAccessKey: "local"
  } : undefined
});

const logger = new Logger("SimpleQueueService");

export class SimpleQueueService {
  public static async sendMessage(
    queueName: string | undefined,
    messageBody: string,
    attributes: object,
    delay?: number
  ): Promise<void> {
    if (!queueName) throw Error("queueName required");

    logger.debug(`Sending message to ${queueName}`, attributes);

    const command = new SendMessageCommand({
      DelaySeconds: delay || Number(SQS_DEFAULT_DELAY_SECONDS),
      MessageAttributes: this.transformAttributeStructure(attributes),
      MessageBody: messageBody,
      QueueUrl: `${SQS_URL}/${queueName}`
    });

    await sqs.send(command);
  }

  private static transformAttributeStructure(attributes: any): any {
    return Object.entries(attributes).reduce((transformed: any, entry: Array<any>) => {
      const [key, value] = entry;
      transformed[key] = {
        DataType: this.getType(value),
        StringValue: typeof attributes[key] === "object" ? JSON.stringify(attributes[key]) : `${attributes[key]}`
      };
      return transformed;
    }, {});
  }

  private static getType(value: any): string {
    if (typeof value === "number") return "Number";
    return "String";
  }

  public static transformAttributesToObject(attributes: { [key: string]: MessageAttributeValue }): any {
    return Object.entries(attributes).reduce((object: any, entry) => {
      const [key, value] = entry;
      if (value.DataType === "Number") {
        object[key] = Number(value.StringValue);
      } else {
        try {
          object[key] = JSON.parse(value.StringValue!);
        } catch (error: any) {
          object[key] = value.StringValue;
        }
      }
      return object;
    }, {});
  }
}
