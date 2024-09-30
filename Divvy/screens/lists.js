import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

export default function DetailsScreen({ route, navigation }) {
  const { rawGeminiResult } = route.params || {};  // Default to empty object if no params

  useEffect(() => {
    console.log('Raw Gemini Result:', rawGeminiResult);
  }, []);

  // Step 1: Parse rawGeminiResult and remove the ```json block
  const inputString = rawGeminiResult.replace(/```json\s*|\s*```/g, '');

  // Step 2: Prepare arrays for item names, prices, and discounts
  const itemNamesList = [];
  const prices = [];
  const discounts = [];

  // Regular expression to extract item details
  const itemRegex = /"itemname":\s*"([^"]+)",\s*"pricename":\s*([\d.]+),\s*"discountamount":\s*([\d.]+)/g;
  let match;

  // Step 3: Extract values using the regex
  while ((match = itemRegex.exec(inputString)) !== null) {
    itemNamesList.push(match[1]);       // Item name
    prices.push(parseFloat(match[2]));  // Price
    discounts.push(parseFloat(match[3])); // Discount
  }

  // Combine item names, prices, and discounts into a single array of objects
  const data = itemNamesList.map((item, index) => ({
    itemName: item,
    price: prices[index],
    discount: discounts[index],
  }));

  // Handle row click
  const handleRowPress = (item) => {
    // Here you can navigate to another screen, show more details, etc.
    Alert.alert('Item Selected', `You selected: ${item.itemName}`);
  };

  // Step 4: Render the list using FlatList with full-width rows
  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => handleRowPress(item)}>
            <Text style={styles.itemText}>Item: {item.itemName}</Text>
            <Text style={styles.priceText}>Price: ${item.price.toFixed(2)}</Text>
            <Text style={styles.discountText}>Discount: ${item.discount.toFixed(2)}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10, // Padding around the list
  },
  row: {
    backgroundColor: 'lightblue',
    padding: 15,
    marginBottom: 10, // Space between rows
    borderRadius: 5,
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  priceText: {
    fontSize: 16,
    color: 'white',
    marginTop: 5,
  },
  discountText: {
    fontSize: 16,
    color: 'white',
    marginTop: 5,
  },
});
