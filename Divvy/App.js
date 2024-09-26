import React, { useState, useEffect } from 'react';
import { View, Button, Image, StyleSheet, Alert, Text, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AWS from 'aws-sdk';
import awsConfig from './awsConfig';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from '@env';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
AWS.config.update(awsConfig);

export default function App() {
  const [image, setImage] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [RawGeminiResult, setRawGeminiResult] = useState('');

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Sorry, we need camera roll permissions to make this work!');
      }
    })();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setExtractedText(''); // Clear previous extracted text
    }
  };

  const saveToDatabase = async (data) => {
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    const timestamp = new Date().toISOString();
    const imageKey = `image-${Date.now()}`;

    const params = {
      TableName: 'textractDynamoDBTable',
      Item: {
        imageKey: imageKey,
        extractedText: data.extractedText,
        tables: data.tables,
        timestamp: timestamp,
      },
    };

    try {
      await dynamodb.put(params).promise();
      console.log('Data saved to DynamoDB successfully');
    } catch (error) {
      console.error('Error saving to DynamoDB:', error);
      throw error;
    }
  };

  const uploadToS3AndAnalyze = async () => {
    if (!image) {
      Alert.alert('Please select an image first');
      return;
    }
  
    const s3 = new AWS.S3();
    const lambda = new AWS.Lambda();
    const response = await fetch(image);
    const blob = await response.blob();
  
    const key = `upload-${Date.now()}.jpg`;
    const params = {
      Bucket: awsConfig.bucket,
      Key: key,
      Body: blob,
      ContentType: 'image/jpeg',
    };
  
    try {
      // Upload to S3
      const uploadResult = await s3.upload(params).promise();
      console.log('Image uploaded successfully. URL:', uploadResult.Location);
  
      // Call Lambda function
      const lambdaParams = {
        FunctionName: 'TextractImageProcessor',
        Payload: JSON.stringify({
          bucket: awsConfig.bucket,
          key: key
        }),
      };
      const lambdaResult = await lambda.invoke(lambdaParams).promise();
  
      console.log('Lambda raw result:', lambdaResult);
  
      let textractResult;
      try {
        textractResult = JSON.parse(lambdaResult.Payload);
      } catch (parseError) {
        console.error('Error parsing Lambda result:', parseError);
        throw new Error('Invalid response from Lambda function');
      }
  
      console.log('Textract result:', JSON.stringify(textractResult, null, 2));
  
      if (textractResult.statusCode === 200) {
        let resultBody;
        try {
          resultBody = JSON.parse(textractResult.body);
          console.log('Parsed resultBody:', JSON.stringify(resultBody, null, 2));
        } catch (parseError) {
          console.error('Error parsing Textract result body:', parseError);
          throw new Error('Invalid Textract result format');
        }
  
        const extractedText = resultBody.extractedText;
        console.log('Extracted Text:', extractedText);
  
        setExtractedText(extractedText);
  
        // Save to DynamoDB
        await saveToDatabase({ extractedText: extractedText });
  
        // Parse receipt data using ChatGPT
        const rawResult = await parseReceiptWithGemini(extractedText);
  
        // Set the raw result in state
        setRawGeminiResult(rawResult);
  
        Alert.alert('Success', 'Receipt processed and saved successfully');
      } else {
        console.error('Textract error:', textractResult);
        const errorMessage = textractResult.body ? JSON.parse(textractResult.body).message : 'Unknown error';
        throw new Error(errorMessage || 'Failed to extract text');
      }
    } catch (error) {
      console.error('Error in uploadToS3AndAnalyze:', error);
      Alert.alert('Error', `Failed to process image: ${error.message}`);
    }
  };
  
  const parseReceiptWithGemini = async (extractedText) => {
    try {
      // For text-only input, use the gemini-pro model
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
      const prompt = `Parse the following receipt text and return a JSON object with storeName, items (array of objects with itemName, price, and discountAmount), tax, and totalCost:\n\n${extractedText}`;
  
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const rawResult = response.text();
  
      console.log('Raw Gemini Result:', rawResult);
      
      return rawResult;
    } catch (error) {
      console.error('Error parsing receipt with Gemini:', error);
      throw error;
    }
  };

return (
  <ScrollView contentContainerStyle={styles.container}>
    <Button title="Pick an image from camera roll" onPress={pickImage} />
    {image && <Image source={{ uri: image }} style={styles.image} />}
    <Button title="Upload to S3 and Analyze" onPress={uploadToS3AndAnalyze} />
    {extractedText !== '' && (
      <View style={styles.textContainer}>
        <Text style={styles.textHeader}>Extracted Text:</Text>
        <Text>{extractedText}</Text>
      </View>
    )}
    {RawGeminiResult !== '' && (
      <View style={styles.textContainer}>
        <Text style={styles.textHeader}>Raw Gemini Result:</Text>
        <Text>{RawGeminiResult}</Text>
      </View>
    )}
  </ScrollView>
);
}


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  image: {
    width: 200,
    height: 200,
    marginVertical: 20,
  },
  textContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    width: '100%',
  },
  textHeader: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
});
