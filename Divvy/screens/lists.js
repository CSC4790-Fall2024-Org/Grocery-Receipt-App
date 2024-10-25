import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Button, Alert, TextInput, Modal } from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function DetailsScreen({ route, navigation }) {
  const { rawGeminiResult } = route.params || {}; // Default to empty object if no params
  const [contributors, setContributors] = useState([]);
  const [newContributor, setNewContributor] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [data, setData] = useState([]);
  const [contributorTotals, setContributorTotals] = useState({});

  useEffect(() => {
    const inputString = rawGeminiResult.replace(/```json\s*|\s*```/g, '');
    const itemNamesList = [];
    const prices = [];
    const discounts = [];

    const itemRegex = /"itemname":\s*"([^"]+)",\s*"pricename":\s*([\d.]+),\s*"discountamount":\s*([\d.]+)/g;
    let match;

    while ((match = itemRegex.exec(inputString)) !== null) {
      itemNamesList.push(match[1]);
      prices.push(parseFloat(match[2]));
      discounts.push(parseFloat(match[3]));
    }

    const initialData = itemNamesList.map((item, index) => ({
      itemName: item,
      price: prices[index],
      discount: discounts[index],
      selectedContributors: [],
    }));

    setData(initialData);
  }, [rawGeminiResult]);

  const addContributor = () => {
    if (newContributor.trim()) {
      setContributors([...contributors, newContributor]);
      setContributorTotals((prev) => ({ ...prev, [newContributor]: 0 }));
      setNewContributor('');
    }
  };

  const handleRowPress = (index) => {
    setSelectedItemIndex(index);
    setModalVisible(true);
  };

  const handleContributorSelect = (contributor) => {
    setData((prevData) => {
      const newData = [...prevData];
      const item = newData[selectedItemIndex];
      const adjustedPrice = item.price - item.discount;
      const previousContributors = [...(item.selectedContributors || [])];

      // Update selected contributors
      if (item.selectedContributors.includes(contributor)) {
        item.selectedContributors = item.selectedContributors.filter(c => c !== contributor);
      } else {
        item.selectedContributors = [...item.selectedContributors, contributor];
      }

      // Update contributor totals
      setContributorTotals((prevTotals) => {
        const newTotals = { ...prevTotals };

        previousContributors.forEach(c => {
          newTotals[c] -= adjustedPrice / previousContributors.length;
        });

        if (item.selectedContributors.length > 0) {
          const contributionPerPerson = adjustedPrice / item.selectedContributors.length;
          item.selectedContributors.forEach(c => {
            newTotals[c] = (newTotals[c] || 0) + contributionPerPerson;
          });
        }

        Object.keys(newTotals).forEach(key => {
          newTotals[key] = Math.max(0, Number(newTotals[key].toFixed(2)));
        });

        return newTotals;
      });

      return newData;
    });
  };

  const handleSave = () => {
    setModalVisible(false);
    setSelectedItemIndex(null);
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.purpleSpace} />
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>

        <View style={styles.addContributorContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter contributor's name"
            value={newContributor}
            onChangeText={setNewContributor}
          />
          <TouchableOpacity style={styles.addButton} onPress={addContributor}>
            <Text style={styles.addButtonText}>Add Contributor</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={data}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <TouchableOpacity style={styles.row} onPress={() => handleRowPress(index)}>
              <Text style={styles.itemText}>{item.itemName}</Text>
              <Text style={styles.priceText}>Price: ${item.price.toFixed(2)}</Text>
              <Text style={styles.discountText}>Discount: ${item.discount.toFixed(2)}</Text>
              <Text style={styles.adjustedPriceText}>
                Adjusted Price: ${(item.price - item.discount).toFixed(2)}
              </Text>
              {item.selectedContributors.length > 0 && (
                <Text style={styles.contributorsText}>
                  Contributors: {item.selectedContributors.join(', ')}
                </Text>
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />

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
      </View>

      <View style={styles.totalsContainer}>
        <Text style={styles.totalsHeader}>Contributor Totals:</Text>
        <FlatList
          data={contributors}
          horizontal={true}
          keyExtractor={(contributor) => contributor}
          renderItem={({ item }) => (
            <Text style={styles.totalText}>
              {item}: ${contributorTotals[item] ? contributorTotals[item].toFixed(2) : 0}
            </Text>
          )}
          contentContainerStyle={{ flexDirection: 'row', alignItems: 'center' }}
        />
          <TouchableOpacity onPress={() => navigation.navigate('Breakdown', {
            contributors,
            itemsData: data.map(item => ({
              itemName: item.itemName,
              pricePerContributor: item.selectedContributors.reduce((acc, contributor) => {
                const contributionAmount = (item.price - item.discount) / item.selectedContributors.length;
                acc[contributor] = contributionAmount;
                return acc;
              }, {}),
            }))
          })}>
            <Text style={styles.summButton}>View Summary</Text>
          </TouchableOpacity>
      </View>
    </>
  );
}


const styles = StyleSheet.create({
  addButton: {
    backgroundColor: '#fff',  // Same background as the contributor box (or any color you want)
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,           // Rounded corners
    alignItems: 'center',       // Center the text
    marginTop: 0,              // Margin to separate it from other components
  },
  
  addButtonText: {
    color: 'black',             // Black text color
    fontWeight: 'bold',         // Bold text
    fontSize: 16,               // Adjust font size if needed
  },  
  summButton:{
    fontSize: 18,
    color: '#000', // Black text
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    padding: 10,
    paddingVertical: 0,
    backgroundColor: '#b9c5ed', // Purplish background
  },
  row: {
    backgroundColor: '#fff', // White cards
    padding: 10, // Adjust padding to make box smaller
    marginBottom: 10,
    borderRadius: 15, // Rounded edges
    justifyContent: 'center',
    width: '90%', // Makes box smaller horizontally
    alignSelf: 'center', // Center box
    shadowColor: '#000', // Add shadow for better card distinction
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5, // For Android shadow
  },
  itemText: {
    fontSize: 18,
    color: '#000', // Black text
    fontWeight: 'bold',
  },
  priceText: {
    fontSize: 16,
    color: '#000', // Black text
    marginTop: 5,
  },
  discountText: {
    fontSize: 16,
    color: '#000', // Black text
    marginTop: 5,
  },
  adjustedPriceText: {
    fontSize: 16,
    color: '#000', // Black text for differentiation
    marginTop: 5,
  },
  contributorsText: {
    fontSize: 14,
    color: '#000', // Black text
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  addContributorContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
    
  },
  backButton: {
    //backgroundColor: '#fff', // White button background
    padding: 5,
    borderRadius: 5,
    width: '20%',
    marginBottom: 10,
   
  },
  backIcon: {
    marginRight: 8, // Space between the icon and the text
  },

  input: {
    flex: 1,
    borderColor: '#000', // Black border
    borderWidth: 1,
    borderRadius: 5,
    marginRight: 10,
    paddingLeft: 8,
    height: 40,
    color: '#000', // Black text
    backgroundColor: '#fff', // White background for the input field
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  totalsContainer: {
    paddingVertical: 10,
    paddingBottom: 20,               // Adjust padding for better spacing
    width: '100%',               // Ensures it takes up the full width of the screen
    backgroundColor: '#D7D7E3',
    alignItems: 'center', 

  },
  
  totalsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000', // Black text
    marginBottom: 10, 
    
  },
  totalText: {
    fontSize: 16,
    color: '#000', // Black text
    paddingBottom: 5,
    marginHorizontal: 3,
    marginBottom: 10, 
  },
  purpleSpace: {
    height: 50, // Adjust the height as needed
    backgroundColor: '#b9c5ed', // Matches the background color for a seamless look
    
  },
});