import { APIGatewayProxyEvent, Handler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

const dynamoDB = new DynamoDB.DocumentClient();

export const handler: Handler = async (event: APIGatewayProxyEvent) => {
  const connection_id = event.requestContext?.connectionId;
  const routeKey = event.requestContext?.routeKey;

  if (routeKey === "$connect") {
    try {
      await dynamoDB
        .put({
          TableName: "ConnectionIDs",
          Item: {
            id: connection_id,
            TimeStamp: Date.now(),
          },
        })
        .promise();

      await dynamoDB
        .update({
          TableName: "VisitorCount",
          Key: { id: "VisitorCount" },
          UpdateExpression: "ADD #count :incr",
          ExpressionAttributeNames: { "#count": "Count" },
          ExpressionAttributeValues: { ":incr": 1 },
        })
        .promise();
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers":
            "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        },
        body: "Connected Successfully",
      };
    } catch (e) {
      console.error("Error recording the connection:", e);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to record connection" }),
      };
    }
  }
  if (routeKey === "$disconnect") {
    try {
      await dynamoDB
        .delete({
          TableName: "ConnectionIDs",
          Key: {
            id: connection_id,
          },
        })
        .promise();
      return {
        statusCode: 200,
        body: "DisconnectedSuccessfully",
      };
    } catch (e) {
      console.error("Error recording the connection:", e);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to record connection" }),
      };
    }
  }
};
