import React, { useState, useEffect } from 'react';
import { View, Button, Image, StyleSheet, Alert, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AWS from 'aws-sdk';
import awsConfig from '../awsConfig';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from '@env';
import { useNavigation } from '@react-navigation/native';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
AWS.config.update(awsConfig);

export default function App() {
    const navigation = useNavigation();
    const [image, setImage] = useState(null);
    const [extractedText, setExtractedText] = useState('');
    const [RawGeminiResult, setRawGeminiResult] = useState('');
    const [isModalVisible, setModalVisible] = useState(false); // For managing modal visibility

    useEffect(() => {
        (async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Sorry, we need camera roll permissions to make this work!');
            }
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Sorry, we need camera roll permissions to make this work!');
            }
        })();
    }, []);

    // Navigate to the Details page when RawGeminiResult is updated
    useEffect(() => {
        if (RawGeminiResult) {
            navigation.navigate('Details', { rawGeminiResult: RawGeminiResult });
        }
    }, [RawGeminiResult]);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 4],
            quality: 1,
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

    const takePhoto = async () => {
      let result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [3, 4],
          quality: 1,
      });
  
      if (!result.canceled) {
          setImage(result.assets[0].uri); // Set the taken image
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
            await dynamodb.put(params).promise();
            console.log('Data saved to DynamoDB successfully');
        } catch (error) {
            console.error('Error saving to DynamoDB:', error);
            throw error;
            console.error('Error saving to DynamoDB:', error);
            throw error;
        }
    };

    const uploadToS3AndAnalyze = async () => {
        if (!image) {
            Alert.alert('Please select an image first');
            return;
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
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            
            const prompt = `Create a JSON object with itemname, pricename, and discountamount with total and tax at the end. Pay attention to discounts. Try not to make more than one input for each item. I don't want code, I want you to write it out for me. \n\n${extractedText}`;

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

    const handleUploadAndNavigate = async () => {
        await uploadToS3AndAnalyze(); // This should populate RawGeminiResult
    };
    
    return (
        await uploadToS3AndAnalyze();
        navigation.navigate('Details', { rawGeminiResult: RawGeminiResult });
    };

    // Modal toggling functions
    const toggleModal = () => {
        setModalVisible(!isModalVisible);
    };

    const handleOption1 = async () => {
      await takePhoto(); // Launch the camera
      toggleModal(); // Close the modal after taking the photo
  };

    const handleOption2 = async () => {
      await pickImage(); // Use the pickImage function to open the camera roll
      toggleModal(); // Close the modal after the image is picked
  };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {image && <Image source={{ uri: image }} style={styles.image} />}
                
                {/* Upload and Analyze button */}
                <TouchableOpacity style={styles.uploadButton} onPress={handleUploadAndNavigate}>
                    <Text style={styles.uploadButtonText}>Upload and Analyze</Text>
                </TouchableOpacity>
                
                {/* Display extracted text if available */}
                {extractedText !== '' && (
                    <View style={styles.textContainer}>
                        <Text style={styles.textHeader}>Extracted Text:</Text>
                        <Text>{extractedText}</Text>
                    </View>
                )}
            </ScrollView>

            <View style={styles.navbar}>
                <TouchableOpacity style={styles.navbarItem} onPress={pickImage}>
                    <Ionicons name="camera" size={32} color="black" />
                </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {image && <Image source={{ uri: image }} style={styles.image} />}

                <TouchableOpacity style={styles.uploadButton} onPress={handleUploadAndNavigate}>
                    <Text style={styles.uploadButtonText}>Upload and Analyze</Text>
                </TouchableOpacity>

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

            <View style={styles.navbar}>
                <TouchableOpacity style={styles.navbarItem} onPress={toggleModal}>
                    <Ionicons name="camera" size={32} color="black" />
                </TouchableOpacity>
            </View>

            {/* Modal for popup menu */}
            <Modal
               visible={isModalVisible}
               transparent={true}
               animationType="none" // Remove animation for better positioning control
               onRequestClose={toggleModal}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <TouchableOpacity onPress={handleOption1} style={styles.modalOption}>
                    <Text>Take a photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleOption2} style={styles.modalOption}>
                    <Text>Upload from camera roll</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
        </View>
    );
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
  navbarItem: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20, // Add some margin from the bottom of the screen
    padding: 15, // Add some padding to make it easier to tap
    backgroundColor: '#f8f8f8', // Optional: add a background color
    borderRadius: 30, // Optional: round the corners
    // Optional: add a shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // Optional: add elevation for Android shadow
    elevation: 5,
  },  
  textHeader: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
});