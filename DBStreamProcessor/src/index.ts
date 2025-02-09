import { Handler } from "aws-lambda";
import { DynamoDB, ApiGatewayManagementApi } from "aws-sdk";

const db = new DynamoDB.DocumentClient();
const apigw = new ApiGatewayManagementApi({
  endpoint: "",
});

interface ConnectionItem {
  id: string;
}

export const handler: Handler = async (event): Promise<void> => {
  try {
    const connections = await db
      .scan({
        TableName: "ConnectionIDs",
      })
      .promise();

    const activeCount = connections.Items?.length ?? 0;
    if (connections.Items) {
      await Promise.all(
        connections.Items.map(async (item) => {
          const { id } = item as ConnectionItem;
          try {
            await apigw
              .postToConnection({
                ConnectionId: id,
                Data: JSON.stringify({ count: activeCount }),
              })
              .promise();
          } catch (err) {
            console.error(`Failed to send message to ${id}`, err);
          }
        })
      );
    }
  } catch (err) {
    console.error(`Error handling the Websocket event`, err);
  }
};
