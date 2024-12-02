import React, { useEffect, useState } from 'react';
import { View, Text, FlatList,  TouchableOpacity, StyleSheet, Dimensions, Button, TextInput, Modal, Alert } from 'react-native';
import * as Contacts from 'expo-contacts';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from '@expo/vector-icons/AntDesign';

export default function DetailsScreen({ route, navigation }) {
  const { rawGeminiResult } = route.params || {};
  const [contributors, setContributors] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [contributorPhones, setContributorPhones] = useState({});
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [newContributor, setNewContributor] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [data, setData] = useState([]);
  const [contributorTotals, setContributorTotals] = useState({});
  const [receiptEndVariables, setReceiptEndVariables] = useState({ subtotal: 0, tax: 0, total: 0 });
  const [editingItemIndex, setEditingItemIndex] = useState(null);


  useEffect(() => {
    const fetchContacts = async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        });
        setContacts(data);
      }
    };

    fetchContacts();
  }, []);

  useEffect(() => {
    updateContributorTotals(data);
  }, [data]);

  useEffect(() => {
    if (newContributor.length > 0) {
      const filtered = contacts.filter(contact =>
        contact.name?.toLowerCase().includes(newContributor.toLowerCase())
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts([]);
    }
  }, [newContributor, contacts]);

  const normalizePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return ''; // Handle undefined or empty case
  
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');
  
    // Check if it's already in international format (starts with +1 for US numbers)
    if (cleaned.length === 10) {
      return `+1${cleaned}`; // Assume it's a US number if it's 10 digits, and add +1
    } else if (cleaned.length === 11 && cleaned.startsWith("1")) {
      return `+${cleaned}`; // Format as +1XXXXXXXXXX if it starts with a 1
    } else {
      return `+${cleaned}`; // Return as is if it doesn't fit common patterns (or add custom logic for other cases)
    }
  };
  const handleEditItem = (index) => {
    setEditingItemIndex(index);
  };

  const updateContributorTotals = (updatedData) => {
    const newTotals = {};
    updatedData.forEach(item => {
      const adjustedPrice = item.price - item.discount;
      const splitPrice = adjustedPrice / item.selectedContributors.length;
      item.selectedContributors.forEach(contributor => {
        if (!newTotals[contributor]) {
          newTotals[contributor] = 0;
        }
        newTotals[contributor] += splitPrice;
      });
    });
    setContributorTotals(newTotals);
  };  
  

  const addContributor = (name, phoneNumber) => {
    if (name.trim()) {
      // If phoneNumber is not provided (not from contacts), show prompt
      if (!phoneNumber) {
        Alert.prompt(
          "Add Phone Number",
          `Please enter a phone number for ${name}`,
          [
            {
              text: "Cancel",
              style: "cancel"
            },
            {
              text: "Add",
              onPress: (inputPhoneNumber) => {
                if (inputPhoneNumber && inputPhoneNumber.trim()) {
                  const normalizedNumber = normalizePhoneNumber(inputPhoneNumber);
                  setContributors((prev) => [...prev, name]);
                  setContributorPhones((prev) => ({ ...prev, [name]: normalizedNumber }));
                  setContributorTotals((prev) => ({ ...prev, [name]: 0 }));
                  setNewContributor('');
                  setFilteredContacts([]);
                } else {
                  // If no phone number provided, show an alert
                  Alert.alert(
                    "Invalid Phone Number",
                    "Please enter a valid phone number to add a contributor",
                    [{ text: "OK" }]
                  );
                }
              }
            }
          ],
          'plain-text'
        );
      } else {
        // Original flow for contacts with phone numbers
        const normalizedNumber = normalizePhoneNumber(phoneNumber);
        setContributors((prev) => [...prev, name]);
        setContributorPhones((prev) => ({ ...prev, [name]: normalizedNumber }));
        setNewContributor('');
        setFilteredContacts([]);
      }
    }
  };
  
  const deleteContributor = (contributorToDelete) => {
    // Remove contributor from all states
    setContributors(prev => prev.filter(contributor => contributor !== contributorToDelete));
    
    // Remove contributor from phones
    setContributorPhones(prev => {
      const updated = { ...prev };
      delete updated[contributorToDelete];
      return updated;
    });
    
    // Remove contributor from totals
    setContributorTotals(prev => {
      const updated = { ...prev };
      delete updated[contributorToDelete];
      return updated;
    });
    
    // Remove contributor from all items' selectedContributors
    setData(prev => prev.map(item => ({
      ...item,
      selectedContributors: item.selectedContributors.filter(
        contributor => contributor !== contributorToDelete
      )
    })));
  };
  const handleSelectAllForContributor = (contributor, isChecked) => {
    setData(prevData => {
      return prevData.map(item => ({
        ...item,
        selectedContributors: isChecked 
          ? [...new Set([...item.selectedContributors, contributor])] // Add contributor if checked
          : item.selectedContributors.filter(c => c !== contributor)  // Remove contributor if unchecked
      }));
    });
  };
  const handleSaveEdit = (newPrice, newDiscount) => {
    const updatedData = [...data];
    updatedData[editingItemIndex] = {
      ...updatedData[editingItemIndex],
      price: newPrice,
      discount: newDiscount
    };
    setData(updatedData);
    setEditingItemIndex(null);
    
    // Recalculate contributor totals
    updateContributorTotals(updatedData);
  };
  
  const handleCancelEdit = () => {
    setEditingItemIndex(null);
  };
  

  useEffect(() => {
    const inputString = rawGeminiResult.replace(/```json\s*|\s*```/g, '');
    const items = [];
    const itemRegex = /"itemname":\s*"([^"]+)",\s*"pricename":\s*([\d.]+),\s*"discountamount":\s*([\d.]+)/g;
    let match;
    while ((match = itemRegex.exec(inputString)) !== null) {
      items.push({
        itemName: match[1],
        price: parseFloat(match[2]),
        discount: parseFloat(match[3]),
        selectedContributors: [],
      });
    }
    setData(items);

    const totalsRegex = /"subtotal":\s*([\d.]+),\s*"tax":\s*([\d.]+),\s*"total":\s*([\d.]+)/;
    const totalsMatch = totalsRegex.exec(inputString);
    if (totalsMatch) {
      setReceiptEndVariables({
        subtotal: parseFloat(totalsMatch[1]) || 0,
        tax: parseFloat(totalsMatch[2]) || 0,
        total: parseFloat(totalsMatch[3]) || 0,
      });
    } else {
      setReceiptEndVariables({ subtotal: 0, tax: 0, total: 0 });
    }
  }, [rawGeminiResult]);

  const handleRowPress = (index) => {
    setSelectedItemIndex(index);
    setModalVisible(true);
  };

  const handleContributorSelect = (itemIndex, contributor) => {

    setData(prevData => {
      const newData = [...prevData];
      const item = newData[itemIndex];
      if (item.selectedContributors.includes(contributor)) {
        item.selectedContributors = item.selectedContributors.filter(c => c !== contributor);
      } else {
        item.selectedContributors.push(contributor);
      }
      return newData;
    });
  };
  
  
  const handleSave = () => {
    const updatedData = [...data];
    // We don't need to update selectedContributors here as it's already part of the item
    setData(updatedData);
    setModalVisible(false);
    
    // Recalculate contributor totals
    updateContributorTotals(updatedData);
  };
  

  const handleViewSummary = () => {
    const updatedData = contributors.map(contributor => {
      return {
        userName: contributor,
        phoneNumber: contributorPhones[contributor] || 'test',
        // phoneNumber: "Hello",
        items: data.filter(item => item.selectedContributors.includes(contributor)).map(item => ({
          itemName: item.itemName,
          storePrice: item.price.toFixed(2),
          sale: item.discount.toFixed(2),
          split: item.selectedContributors,
        })),
      };
    }).filter(user => user.items.length > 0);

    updatedData.receiptEndVariables = receiptEndVariables;
    navigation.navigate('Breakdown', { updatedData });
    // console.log(updatedData);
    console.log(receiptEndVariables);
  };

  const EditItemModal = ({ item, onSave, onCancel }) => {
    const [price, setPrice] = useState(item.price.toString());
    const [discount, setDiscount] = useState(item.discount.toString());
  
    const handleSave = () => {
      const newPrice = parseFloat(price);
      const newDiscount = parseFloat(discount);
      
      if (isNaN(newPrice) || isNaN(newDiscount)) {
        // Handle invalid input
        alert('Please enter valid numbers for price and discount');
        return;
      }
  
      onSave(newPrice, newDiscount);
    };
  
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={true}
        onRequestClose={onCancel}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit {item.itemName}</Text>
            
            <Text style={styles.modalLabel}>Price:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Price"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
            
            <Text style={styles.modalLabel}>Discount:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Discount"
              keyboardType="numeric"
              value={discount}
              onChangeText={setDiscount}
            />
  
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };
  
  

  return (
    <>
      <View style={styles.container}>
      <View style={styles.purpleSpace} />
      <View style={styles.headerContainer}>
  <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
    <AntDesign name="left" size={20} color="black" />
  </TouchableOpacity>
  <Text style={styles.headerText}>Your items</Text>
</View>

        <View style={styles.addContributorContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter contributor's name"
            value={newContributor}
            onChangeText={setNewContributor}
          />
          <TouchableOpacity style={styles.addButton} onPress={() => addContributor(newContributor)}>
            <Text style={styles.addButtonText}>Add Contributor</Text>
          </TouchableOpacity>
        </View>

        {filteredContacts.length > 0 && (
          <View style={styles.contactsDropdown}>
            {filteredContacts.map((contact, index) => (
              <TouchableOpacity key={index} onPress={() => addContributor(
                contact.name, 
                contact.phoneNumbers?.[0]?.number
              )}>
                <Text style={styles.contactText}>{contact.name}</Text>
                <Text style={styles.contactPhone}>{contact.phoneNumbers?.[0]?.number || ''}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <FlatList
          data={data}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemText}>{item.itemName}</Text>
                  <Text style={styles.priceText}>Price: ${item.price.toFixed(2)}</Text>
                  <Text style={styles.discountText}>Discount: ${item.discount.toFixed(2)}</Text>
                  <Text style={styles.adjustedPriceText}>
                    Adjusted Price: ${(item.price - item.discount).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.contributorsContainer}>
                  {contributors.map((contributor) => (
                    <TouchableOpacity
                      key={contributor}
                      style={[
                        styles.contributorButton,
                        item.selectedContributors.includes(contributor) && styles.selectedContributor
                      ]}
                      onPress={() => handleContributorSelect(index, contributor)}
                      activeOpacity = {0.2}
                      delayPressIn={0}
                    >
                      <Text style={[
                        styles.contributorText,
                        item.selectedContributors.includes(contributor) && styles.selectedContributorText
                      ]}>
                        {contributor}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={() => setEditingItemIndex(index)}
              >
                <Text style={styles.editButtonText}>Edit Price</Text>
              </TouchableOpacity>
            </View>
          )}
          
          
          
          contentContainerStyle={{ paddingBottom: 20 }}
        />
       {editingItemIndex !== null && (
  <EditItemModal
    item={data[editingItemIndex]}
    onSave={handleSaveEdit}
    onCancel={handleCancelEdit}
  />
)}



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
  {contributors.map((contributor) => (
    <View key={contributor} style={styles.contributorRow}>
      <View style={styles.leftContainer}>
      <Text style={styles.contributorName}>{contributor}</Text>
      <BouncyCheckbox
      size={20}
      fillColor="#4F65B1"
      unfillColor="#FFFFFF"
      iconStyle={{ borderColor: "#2196F3" }}
      textStyle={{ fontSize: 14, color: '#323232', textDecorationLine: 'none' }}
      text="Select All"
      onPress={(isChecked) => handleSelectAllForContributor(contributor, isChecked)}
    />
        
      </View>
      <View style={styles.rightContainer}>
        <Text style={styles.contributorTotal}>
          ${(contributorTotals[contributor] || 0).toFixed(2)}
        </Text>
        <TouchableOpacity 
          onPress={() => deleteContributor(contributor)}
          style={styles.deleteButton}
        >
          <AntDesign name="close" size={20} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  ))}
  <TouchableOpacity onPress={handleViewSummary}>
    <Text style={styles.summButton}>View Summary & Pay</Text>
  </TouchableOpacity>
</View>


    </>
  );
}

const styles = StyleSheet.create({
  contributorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  contributorName: {
    fontSize: 16,
    paddingHorizontal: 5,
    marginRight: 10,
    width: 120,
  
    // marginLeft: 8,
    // flex: 1, // This will allow the name to take up available space
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10, // Adds space between the amount and X button
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contributorTotal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 2,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 55
  },
  itemInfo: {
    flex: 1,
  },
  contributorButton: {
    padding: 5,
    marginVertical: 2,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
  },
  selectedContributor: {
    backgroundColor: '#4F65B1',
  },
  contributorText: {
    fontSize: 12,
    color: '#000',
  },
  contactsDropdown: { marginTop: 10, backgroundColor: '#f0f0f0', borderRadius: 4 },
  contactText: { padding: 8, fontWeight: 'bold' },
  contactPhone: { paddingLeft: 8, paddingBottom: 8, color: 'gray' },
  editButton: {
    backgroundColor: '#4F65B1',
    padding: 5,
    borderRadius: 5,
    marginTop: 5,
  },
  editButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 5,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 5,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#5B72C0',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
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
  summButton: {
    fontSize: 18,
    color: '#FFFFFF', // Changed to white text
    fontWeight: 'bold',
    backgroundColor: '#4F65B1', 
    padding: 10,
    borderRadius: 8,
    marginTop: 2,
    marginBottom: 1,
    textAlign: 'center',
    width: Dimensions.get('window').width*.6, 
},
  container: {
    flex: 1,
    padding: 10,
    paddingVertical: 0,
    backgroundColor: '#b9c5ed', // Purplish background
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  itemText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  priceText: {
    fontSize: 14,
    color: '#666',
  },
  discountText: {
    fontSize: 14,
    color: '#4CAF50',
  },
  adjustedPriceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  contributorsContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    marginLeft: 10,
  },

  selectedContributorText: {
    color: '#fff',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
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