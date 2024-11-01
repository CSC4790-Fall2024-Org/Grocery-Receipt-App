import React, { useState, useEffect } from 'react';
import { View, Button, Image, StyleSheet, Alert, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AWS from 'aws-sdk';
import awsConfig from '../awsConfig';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from '@env';
import { useNavigation } from '@react-navigation/native';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
AWS.config.update(awsConfig);

const fonts = {
    itemFont: Platform.OS === 'ios' ? 'System' : 'sans-serif', // 'System' is San Francisco on iOS
    boldFont: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
};

export default function App() {

    const navigation = useNavigation();

    const [image, setImage] = useState(null);
    const [extractedText, setExtractedText] = useState('');
    const [RawGeminiResult, setRawGeminiResult] = useState('');
    const [isModalVisible, setModalVisible] = useState(false); 
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
            const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (cameraStatus.status !== 'granted' || libraryStatus.status !== 'granted') {
                Alert.alert('Sorry, we need permissions to make this work!');
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
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
            setExtractedText(''); // Clear previous extracted text
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            alert('Camera access is required to take photos');
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 4],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets ? result.assets[0].uri : result.uri);  // Update URI handling
            console.log('Image URI:', result.assets ? result.assets[0].uri : result.uri); // Log URI for debugging
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
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
            const prompt = `"extractedText":"${extractedText}"

            Using extractedText, generate a JSON object with the following structure:
    
            \`\`\`json
            {
              "items": [
                {"itemname": "string", "pricename": number, "discountamount": number},
                {"itemname": "string", "pricename": number, "discountamount": number},
                // ... more items
              ],
              "subtotal": number,
              "tax": number,
              "total": number
            }
            \`\`\`
    
            Use the provided \`extractedText\` to extract item details.  The \`itemname\` should be the product name. The \`pricename\` should be the item's original price. The \`discountamount\` should be the discount applied to that item (0 if no discount).  Accurately identify discounts, even if they are on a separate line like "2.90-". Associate discounts with the correct item based on their proximity in the text.  The \`subtotal\`, \`tax\`, and \`total\` should reflect the final calculated amounts from the receipt. There should only be ONE itemname, price, and discountamount per object.
    
            Do not include any explanatory text or code; only provide the JSON output.
            `;
    
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
        setLoading(true); // Show loading spinner
        try {
            await uploadToS3AndAnalyze(); // This should populate RawGeminiResult
        } finally {
            setLoading(false); // Hide loading spinner when done
        }
    };

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
            <Image
                source={require('../assets/logo.jpeg')}
                style={styles.backgroundImage}
            />
            {image && <Image source={{ uri: image }} style={styles.image} />}
                
            {/* Upload and Analyze button */}
            {image && (
                loading ? (
                    <ActivityIndicator size="large" color="#6483EA" />
                ) : (
                    <TouchableOpacity style={styles.uploadButton} onPress={handleUploadAndNavigate}>
                        <Text style={styles.uploadButtonText}>Upload and Analyze</Text>
                    </TouchableOpacity>
                )
            )}
                

            <View style={styles.navbar}>
                <TouchableOpacity style={styles.navbarItem} onPress={toggleModal}>
                    <Image
                        source={require('../assets/cart_only.png')}
                        style={{ width: 80, height: 80 }}
                    />
                </TouchableOpacity>
            </View>

            {/* Modal for popup menu */}
            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="none"
                onRequestClose={toggleModal}
            >
                <TouchableOpacity style={styles.modalOverlay} onPress={toggleModal} activeOpacity={1}>
                    <View style={[styles.modalContainer, { bottom: 120 }]}>
                        <TouchableOpacity onPress={handleOption1} style={styles.modalOption}>
                            <Text style={styles.modalText}>Take a photo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleOption2} style={styles.modalOption}>
                            <Text style={styles.modalText}>Upload from camera roll</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#b9c5ed',
  },
  scrollContent: {
    flexGrow: 1,               // Ensures the content grows with the ScrollView
    justifyContent: 'center',   // Centers content vertically
    alignItems: 'center',       // Centers content horizontally
    paddingVertical: 20,        // Optional: Adds some vertical padding for spacing
  },
  image: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  textContainer: {
    marginTop: 0,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    width: '100%',
  },
  uploadButton: {
    marginTop: 5,                // Positions it at the top of the screen
    width: '40%', 
    backgroundColor: '#faf9fb',  // Same background as the contributor box (or any color you want)
    borderRadius: 30,           // Rounded corners
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,       // Padding to give space on left and right
    paddingVertical: 5,         // Padding for top and bottom
    height: '5%',
  },
  uploadButtonText: {
    color: 'black',
    fontWeight: '700',       // Use '700' as a string for consistency
    fontSize: 16,
    textAlign: 'center',
    fontFamily: fonts.boldFont,
  },
  navbar: {
    position: 'absolute',
    bottom: 20,               // Position slightly above the bottom of the screen
    width: '100%',            // Full-width container
    alignItems: 'center',      // Center child items horizontally
    backgroundColor: 'transparent', // Optional background if needed
  },
  navbarItem: {
    position: 'absolute', // Fixes the button position
    bottom: 0, 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    backgroundColor: '#faf9fb',
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 0,
  },  
  textHeader: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0, // Adjust this value depending on the button's height
    left: 0,
    right: 0,
    alignItems: 'center', // Center the modal horizontally relative to the screen
    justifyContent: 'center',
  },
  modalContainer: {
    position: 'absolute',
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
  backgroundImage: {
    position: 'absolute',       // Make the image absolute so it's independent of other content
    width: '100%',              // Cover the entire width of the screen
    height: '50%',             // Cover the entire height of the screen
    alignItems: 'center',
    justifyContent: 'center',                  
    zIndex: -1,                 // Push it behind everything else
    opacity: 0.75,
  },
  uploadButtonText: {
    color: 'black',             // Black text color
    //fontWeight: 'bold',         // Bold text
    fontFamily: fonts.itemFont,
    },
});