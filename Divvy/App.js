import React, { useState, useEffect } from 'react';
import { View, Button, Image, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AWS from 'aws-sdk';
import awsConfig from './awsConfig';

AWS.config.update(awsConfig);

export default function App() {
  const [image, setImage] = useState(null);

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
    }
  };

  const uploadToS3 = async () => {
    if (!image) {
      Alert.alert('Please select an image first');
      return;
    }

    const s3 = new AWS.S3();
    const response = await fetch(image);
    const blob = await response.blob();

    const params = {
      Bucket: awsConfig.bucket,
      Key: `upload-${Date.now()}.jpg`,
      Body: blob,
      ContentType: 'image/jpeg',
    };

    try {
      const result = await s3.upload(params).promise();
      Alert.alert('Success', `Image uploaded successfully. URL: ${result.Location}`);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to upload image');
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Pick an image from camera roll" onPress={pickImage} />
      {image && <Image source={{ uri: image }} style={styles.image} />}
      <Button title="Upload to S3" onPress={uploadToS3} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 200,
    height: 200,
    marginVertical: 20,
  },
});
