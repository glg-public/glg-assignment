import axios, { AxiosError } from "axios";
import { DeleteMessageCommand, ReceiveMessageCommand, SQSClient, Message as SQSMessage } from "@aws-sdk/client-sqs";

import { Instance } from "./Instance";
import { InstanceSignal } from "./InstanceSignal";

import { Logger } from "../../utilities/logger/Logger";
import { ProcessUtilities } from "../../utilities/process/ProcessUtilities";
import { SimpleQueueService } from "../../services/sqs/SimpleQueueService";

const {
  SQS_ENDPOINT,
  SQS_URL,
  REGION,
  INSTANCE_RUN_COUNT,
  INSTANCE_START_DELAY_MS,
  INSTANCE_MESSAGE_RECEIVE_COUNT
} = process.env;

const sqs = new SQSClient({
  region: REGION,
  endpoint: SQS_ENDPOINT,
  credentials: SQS_ENDPOINT ? {
    accessKeyId: "local",
    secretAccessKey: "local"
  } : undefined
});

const SAFE_INSTANCE_MESSAGE_RECEIVE_COUNT = INSTANCE_MESSAGE_RECEIVE_COUNT
  ? Number(INSTANCE_MESSAGE_RECEIVE_COUNT)
  : 10;

const SAFE_INSTANCE_RUN_COUNT = INSTANCE_RUN_COUNT ? Number(INSTANCE_RUN_COUNT) : 3;
const SAFE_INSTANCE_START_DELAY_MS = INSTANCE_START_DELAY_MS ? Number(INSTANCE_START_DELAY_MS) : 0;

export abstract class QueueInstance<M> extends Instance {
  protected readonly logger: Logger;
  protected readonly queueName: string;

  private runCount: number = 0;

  protected constructor({ loggerPrefix, queueName }: { loggerPrefix: string, queueName: string | undefined }) {
    super();

    this.logger = new Logger(loggerPrefix);

    if (!queueName) throw Error("Expected to have queueName");
    this.queueName = queueName;
  }

  protected abstract getRequiredMessageFields(): Array<keyof M>;
  protected abstract process(message: M, originalMessage?: SQSMessage): Promise<void>;

  public async start(): Promise<void> {
    if (this.runCount === SAFE_INSTANCE_RUN_COUNT) {
      this.emit(InstanceSignal.CLEAN_SHUTDOWN);
      return;
    }

    await ProcessUtilities.sleep(SAFE_INSTANCE_START_DELAY_MS);

    this.logger.trace(`Polling ${this.queueName}...`);
    const result = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: `${SQS_URL}/${this.queueName}`,
        MaxNumberOfMessages: SAFE_INSTANCE_MESSAGE_RECEIVE_COUNT,
        WaitTimeSeconds: 10,
        MessageAttributeNames: ["All"]
      })
    );

    if (!result.Messages) {
      this.logger.trace("No messages on queue...!");
      this.runCount++;
      await this.start();
      return;
    }

    for (const message of result.Messages) {
      let attributes;
      try {
        attributes = SimpleQueueService.transformAttributesToObject(message.MessageAttributes!);

        /* Validate message form */
        const suppliedFields = Object.keys(attributes);
        const missingFields = this.getRequiredMessageFields().filter((field: any) => !suppliedFields.includes(field));
        if (missingFields.length > 0) {
          this.logger.error(`Message missing required fields!: [${missingFields.join(", ")}]`);
          throw Error("Missing Required Fields");
        }

        const jobStartEpoch = Date.now();
        this.logger.dashboard({ action: "JOB_START", ...attributes });
        this.logger.debug(`Processing...`);

        await this.process(attributes, message);

        const jobEndEpoch = Date.now();
        this.logger.debug(`Processed...`);
        this.logger.dashboard({ action: "JOB_END", ...attributes, jobRuntimeMs: jobEndEpoch - jobStartEpoch });

        await sqs.send(
          new DeleteMessageCommand({ ReceiptHandle: message.ReceiptHandle, QueueUrl: `${SQS_URL}/${this.queueName}` })
        );
        this.logger.trace(`Deleted ${message.ReceiptHandle} from ${this.queueName}`);
      } catch (error: AxiosError | any) {
        this.logger.dashboard({ action: "JOB_ERROR", ...attributes });
        QueueInstance.logError(this.logger, error);
      }
    }

    this.runCount++;
    await this.start();
  }

  public static logError(logger: Logger, error: any) {
    if (!axios.isAxiosError(error)) {
      logger.error(error.stack || error.message);
      return;
    }

    const err = error as AxiosError;
    logger.error(`(${err.response?.status || "unknown"}) status on to ${err.request?._currentUrl || "unknown"}`);
    logger.error(err.response?.data || err.stack);
  }

  public async stop(): Promise<void> {}
}
