import { APIGatewayProxyHandler } from 'aws-lambda';
import { Textract } from 'aws-sdk';
import { DynamoDB } from 'aws-sdk';

const analyzeText = async (key: string) => {
  const payload = {
    Document: {
      S3Object: {
        Bucket: 'divvybucket1',
        Name: key,
      },
    },
  };

  return new Textract().detectDocumentText(payload).promise();
};

export const handler: APIGatewayProxyHandler = async (event) => {
  return textractScan(event);
};

const textractScan = async (event: any) => {
  try {
    console.log(event);
    const body = JSON.parse(event.body || '{}');
    const { imageKey } = body;

    if (!imageKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing imageKey in request body' }),
      };
    }

    const analyzeTextResult = await analyzeText(imageKey);

    const rawData = analyzeTextResult.Blocks;
    console.info(rawData);

    if (!rawData || rawData.length === 0) {
      console.error('No text detected');
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'INVALID_DOCUMENT' }),
      };
    } 

    const payload = {
      TableName: 'textractDynamoDBTable',
      Item: {
        imageKey: imageKey,
        textractData: rawData,
        timestamp: new Date().toISOString(),
      },
    };

    await new DynamoDB.DocumentClient().put(payload).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Text successfully analyzed',
        data: rawData,
      }),
    };

  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'ERROR_ANALYZING_DOCUMENT' }),
    };
  }
};
