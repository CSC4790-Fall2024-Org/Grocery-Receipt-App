import React, { useState, useEffect } from 'react';
import { View, Button, Image, StyleSheet, Alert, Text, ScrollView, TouchableOpacity, Modal, ImageBackground } from 'react-native';
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
            const uploadResult = await s3.upload(params).promise();
            console.log('Image uploaded successfully. URL:', uploadResult.Location);

            const lambdaParams = {
                FunctionName: 'TextractImageProcessor',
                Payload: JSON.stringify({
                    bucket: awsConfig.bucket,
                    key: key
                }),
            };
            const lambdaResult = await lambda.invoke(lambdaParams).promise();

            let textractResult;
            try {
                textractResult = JSON.parse(lambdaResult.Payload);
            } catch (parseError) {
                throw new Error('Invalid response from Lambda function');
            }

            if (textractResult.statusCode === 200) {
                const resultBody = JSON.parse(textractResult.body);
                const extractedText = resultBody.extractedText;

                setExtractedText(extractedText);
                await saveToDatabase({ extractedText: extractedText });

                const rawResult = await parseReceiptWithGemini(extractedText);
                setRawGeminiResult(rawResult);

                Alert.alert('Success', 'Receipt processed and saved successfully');
            } else {
                const errorMessage = textractResult.body ? JSON.parse(textractResult.body).message : 'Unknown error';
                throw new Error(errorMessage || 'Failed to extract text');
            }
        } catch (error) {
            Alert.alert('Error', `Failed to process image: ${error.message}`);
        }
    };

    const parseReceiptWithGemini = async (extractedText) => {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `Parse the following receipt text and return a JSON object:\n\n${extractedText}`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            throw error;
        }
    };

    const handleUploadAndNavigate = async () => {
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
    <ImageBackground 
        source={require('/Users/markfaverzani/Desktop/GitHub/Grocery-Receipt-App/Divvy/assets/divvy.jpg')}  // Path to your background image
        style={styles.backgroundImage}
    >
        <View style={styles.container}>
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
               animationType="none"
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
    </ImageBackground>
);

}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        //backgroundColor: '#b6c5ec',
    },
    backgroundImage: {
        width: 400, // Set the desired width
        height: 600, // Set the desired height
        resizeMode: 'contain',  // Adjust to ensure the image is properly contained
        alignSelf: 'center',    // Center the image within the screen
        justifyContent: 'center',  // Ensure content stays centered
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
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#f8f8f8',
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    textHeader: {
        fontWeight: 'bold',
        marginBottom: 5,
    },
    modalOverlay: {
      position: 'absolute',
      bottom: 120, // Adjust this value depending on the button's height
      left: 0,
      right: 0,
      alignItems: 'center', // Center the modal horizontally relative to the screen
  },
  modalContainer: {
      width: 200,
      backgroundColor: '#fff',
      padding: 10,
      borderRadius: 10,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
  },
  modalOption: {
    padding: 10,
    marginBottom: 5, // Space between the options
    borderWidth: 2, // Full border around the option
    borderColor: '#ccc', // Border color
    borderRadius: 5, // Rounded corners for each option
    backgroundColor: '#fff', // Optional: Background color inside each option
    alignItems: 'center', // Center the text inside the button
},
});
