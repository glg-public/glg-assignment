import { QueueInstance } from "../classes/QueueInstance";
import { OrderMessage } from "../../definitions/messages/OrderMessage";
import { OrdersDatabase } from "../../databases/OrdersDatabase";

const { SQS_DEAD_LETTERS_QUEUE_NAME } = process.env;

export class DeadLetterInstance extends QueueInstance<OrderMessage> {
  constructor() {
    super({ loggerPrefix: "DeadLetterInstance", queueName: SQS_DEAD_LETTERS_QUEUE_NAME });
  }

  protected getRequiredMessageFields(): Array<keyof OrderMessage> {
    return ["orderId"];
  }

  /**
   * Handle the dead letter message by storing it in the database.
   */
  protected async process({ orderId }: OrderMessage): Promise<void> {
    const order = await OrdersDatabase.getOrderById(orderId);

  }
}
