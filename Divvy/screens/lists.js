import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions  } from 'react-native';

export default function DetailsScreen({ route }) {
  const { rawGeminiResult } = route.params || {};  // Default to empty object if no params

  // Log the rawGeminiResult to see its structure
  useEffect(() => {
    console.log('Raw Gemini Result:', rawGeminiResult);
  }, []);

  const screenWidth = Dimensions.get('window').width;

  const squareSize = screenWidth / 2 - 10;

  inputString = rawGeminiResult.replace(/```json\s*|\s*```/g, '');

  const itemNamesList = [];
    const prices = [];
    const discounts = [];

    // Regular expressions to match item details
    const itemRegex = /"itemName":\s*"([^"]+)",\s*"price":\s*([\d.]+),\s*"discountAmount":\s*([\d.]+)/g;
    let match;

    // Step 3: Extract values using the regex
    while ((match = itemRegex.exec(inputString)) !== null) {
        itemNamesList.push(match[1]);  // Item name
        prices.push(parseFloat(match[2]));  // Price
        discounts.push(parseFloat(match[3]));  // Discount
    }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Details Screen</Text>
      <Text>Analysis: {rawGeminiResult}</Text>
      <Text>ItemNames: {itemNamesList}</Text>
      {/* Uncomment and adjust this if rawGeminiResult has more properties */}
      {/* <Text>Other Data: {rawGeminiResult.otherData || 'No Other Data'}</Text> */}
    </View>
  );
}
// JSON.parse(rawGeminiResult)

const styles = StyleSheet.create({
    container: {
      padding: 5, // Padding around the grid
    },
    square: {
      backgroundColor: 'lightblue',
      margin: 5, // Space between squares
      justifyContent: 'center',
      alignItems: 'center',
    },
    squareText: {
      fontSize: 14,
      color: 'white',
      fontWeight: 'bold',
      textAlign: 'center',
    },
  });