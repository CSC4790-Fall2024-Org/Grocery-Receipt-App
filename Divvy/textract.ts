import { Textract } from 'aws-sdk';
import { DynamoDB } from 'aws-sdk';

const analyzeText = async(key: string) => {
  const payload = {
      Document: {
        S3Object: {
          //the bucket where you uploaded your images
          Bucket: 'BUCKET_NAME',
          Name: key,
        },
      },
    };

    return new Textract().detectDocumentText(payload);
}

const textractScan = async (event: AWSLambda.APIGatewayProxyEvent) => {
    try {
      console.log(event);
      const body = JSON.parse(event.body);
  
      const { imageKey } = body;
  
      const analyzeTextResult = await analyzeText(imageKey);
      const parsedData = await AWSJsonParser(analyzeTextResult);
      console.info(parsedData);
      const rawData = parsedData.getRawData();
      console.info(data);
        if (data.length === 0) {
          console.error('no text detected');
   return {
        statusCode: 400,
        body: JSON.stringify({ message: 'INVALID_DOCUMENT' }),
      };
        }
      const payload = {
       ...someData,
       textractData: rawData
      }
      new DynamoDB.DocumentClient(payload).put;
  
      ....
  
    } catch (e) {
      console.log(e);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'ERROR_ANALYZING_DOCUMENT' }),
      };
    }
  };