import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Button, TextInput, Modal } from 'react-native';
import * as Contacts from 'expo-contacts';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
  

  const addContributor = (name, phoneNumber) => {
    if (name.trim()) {
      // Only normalize if phoneNumber is defined
      const normalizedNumber = phoneNumber ? normalizePhoneNumber(phoneNumber) : '';
  
      setContributors((prev) => [...prev, name]);
      setContributorPhones((prev) => ({ ...prev, [name]: normalizedNumber }));
      setContributorTotals((prev) => ({ ...prev, [name]: 0 }));
      setNewContributor('');
      setFilteredContacts([]);
    }
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

  const handleContributorSelect = (contributor) => {
    setData((prevData) => {
      const newData = [...prevData];
      const item = newData[selectedItemIndex];
      const adjustedPrice = item.price - item.discount;
      const previousContributors = [...(item.selectedContributors || [])];

      if (item.selectedContributors.includes(contributor)) {
        item.selectedContributors = item.selectedContributors.filter(c => c !== contributor);
      } else {
        item.selectedContributors = [...item.selectedContributors, contributor];
      }

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
        <TouchableOpacity onPress={handleViewSummary}>
          <Text style={styles.summButton}>View Summary</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  contactsDropdown: { marginTop: 10, backgroundColor: '#f0f0f0', borderRadius: 4 },
  contactText: { padding: 8, fontWeight: 'bold' },
  contactPhone: { paddingLeft: 8, paddingBottom: 8, color: 'gray' },
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