import React, { useState, useEffect } from 'react';
import { View, Button, Image, StyleSheet, Alert, Text, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AWS from 'aws-sdk';
import awsConfig from './awsConfig';

AWS.config.update(awsConfig);


export default function App() {
  const [image, setImage] = useState(null);
  const [extractedText, setExtractedText] = useState('');

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
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setExtractedText(''); // Clear previous extracted text
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
  
      console.log('Sending to Lambda:', JSON.stringify(lambdaParams, null, 2));
  
      const lambdaResult = await lambda.invoke(lambdaParams).promise();
      console.log('Lambda result:', JSON.stringify(lambdaResult, null, 2));
  
      const textractResult = JSON.parse(lambdaResult.Payload);
      console.log('Textract result:', JSON.stringify(textractResult, null, 2));
  
      if (textractResult.statusCode === 200) {
        const resultBody = JSON.parse(textractResult.body);
        setExtractedText(resultBody.extractedText);
        Alert.alert('Success', 'Image processed successfully');
      } else {
        console.error('Textract error:', textractResult);
        const errorBody = JSON.parse(textractResult.body);
        throw new Error(errorBody.message || 'Failed to extract text');
      }
    } catch (error) {
      console.error('Error in uploadToS3AndAnalyze:', error);
      Alert.alert('Error', 'Failed to process image: ' + error.message);
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
