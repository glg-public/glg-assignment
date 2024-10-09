import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const { REGION, DYNAMODB_ENDPOINT } = process.env;

export class DynamoService {
  private static client?: DynamoDBClient;

  public static getClient(): DynamoDBClient {
    if (this.client) return this.client;

    /* Unit & Integration Testing uses a special library for DynamoDB */
    if (DYNAMODB_ENDPOINT) {
      this.client = new DynamoDBClient({
        tls: false,
        region: "local",
        endpoint: DYNAMODB_ENDPOINT,
        credentials: {
          accessKeyId: "local",
          secretAccessKey: "local"
        }
      });
    } else {
      this.client = new DynamoDBClient({ region: REGION });
    }

    return this.client;
  }
}
