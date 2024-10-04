import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Button, Alert, TextInput, Modal } from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';

export default function DetailsScreen({ route, navigation }) {
  const { rawGeminiResult } = route.params || {}; // Default to empty object if no params
  const [contributors, setContributors] = useState([]); // List of contributors
  const [newContributor, setNewContributor] = useState(''); // New contributor input
  const [modalVisible, setModalVisible] = useState(false); // Modal visibility
  const [selectedItemIndex, setSelectedItemIndex] = useState(null); // Index of currently selected item
  const [data, setData] = useState([]); // State for item data
  const [contributorTotals, setContributorTotals] = useState({}); // Totals for each contributor

  useEffect(() => {
    //console.log('Raw Gemini Result:', rawGeminiResult);

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

    // Combine item names, prices, discounts, and selected contributors into a single array of objects
    const initialData = itemNamesList.map((item, index) => ({
      itemName: item,
      price: prices[index],
      discount: discounts[index],
      selectedContributors: [], // Initialize selected contributors for each item
    }));

    // Set the initial data to state
    setData(initialData);
  }, [rawGeminiResult]); // Runs when rawGeminiResult changes

  // Function to add a contributor
  const addContributor = () => {
    if (newContributor.trim()) {
      setContributors([...contributors, newContributor]);
      setContributorTotals((prev) => ({ ...prev, [newContributor]: 0 })); // Initialize total for new contributor
      setNewContributor('');
    }
  };

  // Handle row click
  const handleRowPress = (index) => {
    setSelectedItemIndex(index);
    setModalVisible(true);
  };

  const handleContributorSelect = (contributor) => {
    setData((prevData) => {
      const newData = [...prevData];
      const item = newData[selectedItemIndex];
      const previousContributors = [...(item.selectedContributors || [])];
      const adjustedPrice = item.price - item.discount;
  
      // Update selected contributors
      if (item.selectedContributors.includes(contributor)) {
        item.selectedContributors = item.selectedContributors.filter(c => c !== contributor);
      } else {
        item.selectedContributors = [...item.selectedContributors, contributor];
      }
  
      // Update contributor totals
      setContributorTotals(prevTotals => {
        const newTotals = { ...prevTotals };
  
        // Remove previous contributions
        previousContributors.forEach(c => {
          if (previousContributors.length > 0) {
            newTotals[c] -= adjustedPrice / previousContributors.length;
          }
        });
  
        // Add new contributions
        if (item.selectedContributors.length > 0) {
          const contributionPerPerson = adjustedPrice / item.selectedContributors.length;
          item.selectedContributors.forEach(c => {
            newTotals[c] = (newTotals[c] || 0) + contributionPerPerson;
          });
        }
  
        // Ensure no negative values
        Object.keys(newTotals).forEach(key => {
          newTotals[key] = Math.max(0, Number(newTotals[key].toFixed(2)));
        });
  
        return newTotals;
      });
  
      return newData;
    });
  };
  
  

  // Handle save action
  const handleSave = () => {
    setModalVisible(false); // Close the modal
    setSelectedItemIndex(null); // Reset the selected item index
  };

  return (
    <View style={styles.container}>
      {/* Add contributor button and input */}
      <View style={styles.addContributorContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter contributor's name"
          value={newContributor}
          onChangeText={setNewContributor}
        />
        <Button title="Add Contributor" onPress={addContributor} />
      </View>

      {/* List of items */}
      <FlatList
        data={data}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity style={styles.row} onPress={() => handleRowPress(index)}>
            <Text style={styles.itemText}>Item: {item.itemName}</Text>
            <Text style={styles.priceText}>Price: ${item.price.toFixed(2)}</Text>
            <Text style={styles.discountText}>Discount: ${item.discount.toFixed(2)}</Text>
            <Text style={styles.adjustedPriceText}>Adjusted Price: ${(item.price - item.discount).toFixed(2)}</Text>
            {/* Display selected contributors */}
            {item.selectedContributors.length > 0 && (
              <Text style={styles.contributorsText}>
                Contributors: {item.selectedContributors.join(', ')}
              </Text>
            )}
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Modal for selecting contributors */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text>Select contributors for {data[selectedItemIndex]?.itemName}</Text>
            <FlatList
              data={contributors}
              keyExtractor={(contributor) => contributor}
              renderItem={({ item: contributor }) => (
                <View style={styles.checkboxContainer}>
                  <BouncyCheckbox
                    isChecked={data[selectedItemIndex]?.selectedContributors.includes(contributor)}
                    onPress={() => handleContributorSelect(contributor)}
                    text={contributor}
                  />
                </View>
              )}
            />
            <Button title="Save" onPress={handleSave} />
          </View>
        </View>
      </Modal>

      {/* Display contributor totals */}
      <View style={styles.totalsContainer}>
        <Text style={styles.totalsHeader}>Contributor Totals:</Text>
        {contributors.map((contributor) => (
          <Text key={contributor} style={styles.totalText}>
            {contributor}: ${contributorTotals[contributor] ? contributorTotals[contributor].toFixed(2) : 0}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10, // Padding around the list
  },
  addContributorContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center', // Align input and button vertically
  },
  input: {
    flex: 1,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginRight: 10,
    paddingLeft: 8,
    height: 40, // Adjust height to match button
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
  adjustedPriceText: {
    fontSize: 16,
    color: 'yellow', // Change color to differentiate adjusted price
    marginTop: 5,
  },
  contributorsText: {
    fontSize: 14,
    color: 'white',
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  totalsContainer: {
    marginTop: 20,
  },
  totalsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalText: {
    fontSize: 16,
  },
});
