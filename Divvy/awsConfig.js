import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
 
// AWS SDK configuration
const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  bucket: 'divvybucket1',
};
 
export default awsConfig;
 