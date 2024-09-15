import * as ImagePicker from 'expo-image-picker';
import { Alert, Button, StyleSheet, View } from 'react-native';
import { Storage } from 'aws-amplify';

const options = {
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: false,
  aspect: [4, 3],
  quality: 1,
};

const Home = () => {
  const libraryPickerHandler = async () => {
    const result = await ImagePicker.launchImageLibraryAsync(options);

    if (result.cancelled) {
      Alert.alert('Image selection cancelled');
    } else {
      await onImageSelect(result.uri);
    }
  };

  const onImageSelect = async (uri) => {
    // Fetch the image as a blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Generate a unique name for the image
    const naming = `${new Date().getTime()}.jpeg`;

    // Upload image to S3
    await Storage.put(naming, blob, {
      contentType: 'image/jpeg',
      level: 'protected',
    });

    // Send the image key to the backend API for processing
    const apiResponse = await fetch('https://lbil0qiao6.execute-api.us-east-1.amazonaws.com/dev/main/textract-scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageKey: naming, // Pass the generated S3 image key here
      }),
    });

    if (apiResponse.ok) {
      Alert.alert('Success', 'Image uploaded and processed!');
    } else {
      Alert.alert('Error', 'Failed to process the image');
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title="Select Image from Library"
        onPress={libraryPickerHandler}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Home;
