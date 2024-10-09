import { promises as fs } from "fs";

import { SingletonInstance } from "../classes/SingletonInstance";
import { InstanceSignal } from "../classes/InstanceSignal";
import { DynamoService } from "../../services/dynamo/DynamoService";
import { CreateTableCommand, DeleteTableCommand } from "@aws-sdk/client-dynamodb";

const { STAGE, RECEIPT_DIRECTORY_PATH } = process.env;

export class ProjectSetupInstance extends SingletonInstance {
  constructor() {
    super({ loggerPrefix: "ProjectSetupInstance" });
  }

  public async start(): Promise<void> {
    try {
      await this.createTables();
      await this.createTemporaryDirectory();
      this.emit(InstanceSignal.CLEAN_SHUTDOWN);
    }
    catch (error: any) {
      this.handleError(error);
    }
  }

  public async stop(): Promise<void> {
  }

  private async createTemporaryDirectory(): Promise<void> {
    if (!RECEIPT_DIRECTORY_PATH) throw new Error("RECEIPT_DIRECTORY_PATH is not defined");
    await fs.mkdir(RECEIPT_DIRECTORY_PATH, { recursive: true });
    this.logger.info(`Created directory: ${RECEIPT_DIRECTORY_PATH}`);
  }

  private async createTables(): Promise<void> {
    const client = DynamoService.getClient();

    /* Delete any existing tables */
    const tables = [`dead-letters-${STAGE}`, `orders-${STAGE}`];
    for (const table of tables) {
      await client.send(new DeleteTableCommand({ TableName: table })).catch(() => {});
    }

    const commands = [
      new CreateTableCommand({
        TableName: `dead-letters-${STAGE}`,
        KeySchema: [
          { AttributeName: 'deadLetterId', KeyType: 'HASH' },
        ],
        AttributeDefinitions: [
          { AttributeName: 'deadLetterId', AttributeType: 'S' },
          { AttributeName: 'orderId', AttributeType: 'S' },
          { AttributeName: 'createdAt', AttributeType: 'N' },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'orderIdIndex',
            KeySchema: [
              { AttributeName: 'orderId', KeyType: 'HASH' },
            ],
            Projection: {
              ProjectionType: 'ALL',
            },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5,
            }
          },
          {
            IndexName: 'createdAtIndex',
            KeySchema: [
              { AttributeName: 'createdAt', KeyType: 'HASH' },
            ],
            Projection: {
              ProjectionType: 'ALL',
            },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5,
            }
          },
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        }
      }),
      new CreateTableCommand({
        TableName: `orders-${STAGE}`,
        KeySchema: [
          { AttributeName: 'orderId', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'orderId', AttributeType: 'S' },
          { AttributeName: 'referenceId', AttributeType: 'S' },
          { AttributeName: 'status', AttributeType: 'S' },
          { AttributeName: 'userId', AttributeType: 'S' },
          { AttributeName: 'createdAt', AttributeType: 'N' },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'userIdIndex',
            KeySchema: [
              { AttributeName: 'userId', KeyType: 'HASH' },
            ],
            Projection: {
              ProjectionType: 'ALL',
            },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5,
            }
          },
          {
            IndexName: 'referenceIdIndex',
            KeySchema: [
              { AttributeName: 'referenceId', KeyType: 'HASH' },
            ],
            Projection: {
              ProjectionType: 'ALL',
            },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5,
            }
          },
          {
            IndexName: 'statusIndex',
            KeySchema: [
              { AttributeName: 'status', KeyType: 'HASH' },
            ],
            Projection: {
              ProjectionType: 'ALL',
            },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5,
            }
          },
          {
            IndexName: 'createdAtIndex',
            KeySchema: [
              { AttributeName: 'createdAt', KeyType: 'HASH' },
            ],
            Projection: {
              ProjectionType: 'ALL',
            },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5,
            }
          },
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        }
      })
    ];

    for (const command of commands) {
      await client.send(command);
    }

    this.logger.info(`Created Tables: ${tables.join(", ")}!`);
  }
}
