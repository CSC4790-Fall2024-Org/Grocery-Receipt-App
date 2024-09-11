import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import { Storage, API } from 'aws-amplify';
//Inside your component

const options = {
  mediaType: 'photo',
  quality: 0.5,
  includeBase64: true,
};

const libraryPickerHandler = () => {
    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else {
        await onImageSelect(response?.assets[0].uri);
      }
    });
  };

  const cameraPickerHandler = async () => {
    launchCamera(options, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else {
        await onImageSelect(response?.assets[0].uri);
      }
    });
  };

const onImageSelect = async (uri) => {
  let imageResponse = await fetch(uri);
  const blob = await imageResponse.blob();

  // timestamp for random image names
  let naming = `{new Date().getTime()}.jpeg`;

  const s3Response = await Storage.put(naming, blob, {
    contentType: 'image/jpeg',
    level: 'protected',
  });

 await API.post('your-endpoint-name', '/main/textract-scan', {
    body: {
      imageKey: s3Response.key,
    },
  });
};

