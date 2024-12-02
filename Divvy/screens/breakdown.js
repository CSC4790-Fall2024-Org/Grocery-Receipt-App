import React, { useState, useRef, useEffect} from 'react';
import { View, Text, FlatList, StyleSheet, ScrollView, Dimensions, 
         TouchableOpacity, Platform, LayoutAnimation, UIManager, 
        Image, Modal, Linking, TextInput, Keyboard } from 'react-native';
import { useRoute } from '@react-navigation/native';
import AntDesign from '@expo/vector-icons/AntDesign'; // Import AntDesign
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient
import { useNavigation } from '@react-navigation/native'; // If using React Navigation
// import { NavigationContainer } from '@react-navigation/native'; 
import * as SMS from 'expo-sms';

// Fixed list of names
// const names = ['Satrant', 'Luke', 'Charlie', 'Joey', 'Jaden', 'William', 'Daniel', 'Sara', 'Alex', 'Mike'];
const currency = "$";  // Adding the currency constant

const colors = {
  saleColor: 'red',
  arithmeticColor: 'black',
  yourCostColor: 'green',
  backgroundColorBehindCard: '#b9c5ed', //Purple background old is #e1e8f3
  cardColor: '#fbfbfb',  //inside cards 
  breakdownColor: '#faf9fb', //bottom breakdown tab
  highlightColor: '#d2edfd',
  taxColor: '#f19508',
  finalTotalColor: '#5289ef', 
  finalTotalColorGreen: '#14702c',
  fadedHighlightColor: 'rgba(210, 237, 253, 0.3)',
};

const fonts = {
  itemFont: Platform.OS === 'ios' ? 'System' : 'sans-serif', // 'System' is San Francisco on iOS
};

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const calculateYourCost = (storePrice, sale, split) => {
  const costAfterSale = parseFloat(storePrice) - parseFloat(sale);
  const yourCost = costAfterSale / split.length;
  return yourCost.toFixed(2); // Return as string with 2 decimal places
};

const calculateNetPrice = (storePrice, sale) => {
  const costAfterSale = parseFloat(storePrice) - parseFloat(sale);
  return costAfterSale.toFixed(2);
};

// const DATA1 = [
//   {
//     userName: 'Self',
//     phoneNumber: '9735580705',
//     items: [
//       { itemName: 'Current Device Item1', storePrice: '100.00', split: [names[0], names[1]], sale: '0.00' },
//       { itemName: 'Current Device Item2', storePrice: '3.00', split: [names[2]], sale: '0.50' },
//       { itemName: 'Current Device Item3', storePrice: '12.00', split: [names[3], names[4]], sale: '0.20' },
//       { itemName: 'Current Device Item4', storePrice: '5.00', split: [names[5]], sale: '0.30' },
//       { itemName: 'Current Device Item5', storePrice: '10.00', split: [names[6], names[0], names[0], names[0], names[0]], sale: '1.50' }
//     ],
// },
//   {
//     userName: 'Luke',
//     phoneNumber: '2034441066',
//     items: [
//       { itemName: 'Garden Salsa Chip Dip', storePrice: '100.00', split: [names[0], names[1]], sale: '0.00' },
//       { itemName: 'Nerds Gummy Clusters', storePrice: '3.00', split: [names[2]], sale: '0.50' },
//       { itemName: 'Snickerdoodle Cookies', storePrice: '12.00', split: [names[3], names[4]], sale: '0.20' },
//       { itemName: 'Peanut Butter Cookies', storePrice: '5.00', split: [names[5]], sale: '0.30' },
//       { itemName: 'Reeces Thins', storePrice: '10.00', split: [names[6], names[0], names[0], names[0], names[0]], sale: '1.50' }
//     ],
// },
// ];
 
// Function to get the sum of a specific category for a given user
const getCategoryTotal = (data, category) => {
  let total = 0;
 
  data.items.forEach(item => {
    if (category === 'storePrice') {
      total += parseFloat(item.storePrice);
    } else if (category === 'yourCost') {
      total += parseFloat(item.yourCost);
    } else if (category === 'sale') {
      total += parseFloat(item.sale);
    }
  });
 
  return total.toFixed(2); // Returning the total as a string with two decimal places
};
 
// Helper function to get the first two letters of names and capitalize them
const getSplitDisplayNames = (split) => {
  return split.map(name => name.substring(0, 2).toUpperCase());
};

const TaxRow = ({ totalSubtotal, userSubtotal, item, proportionalTax, tax, numUsers, netPriceIsSelected }) => {  // Receive data, tax, and currency as props

if (!item || !item.items || !Array.isArray(item.items)) {
    console.error("Invalid item data in TaxRow:", item);
    return <Text>Invalid item data for TaxRow</Text>;
  }

const userTax = proportionalTax 
  ? (userSubtotal / totalSubtotal) * tax 
  : (tax / numUsers); 

return (
    // <View style={styles.row}>
    //     <View style={[styles.adjustedWidthContainer, {minWidth: Dimensions.get('window').width*.72, maxWidth: Dimensions.get('window').width*.72}]}>
    //         <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    //             <Text style={[styles.itemText, styles.boldText]} numberOfLines={1}>
    //                 <Text style={styles.bulletPoint}>•</Text> {proportionalTax ? `Tax (${((userSubtotal / totalSubtotal) * 100).toFixed(2)}%)` : `Tax (${((1/numUsers) * 100).toFixed(0)}%)`}
    //             </Text>
    //         </ScrollView>
    //     </View>
    //     <View style={styles.rightContainerV2}>
    //         <View style={[styles.yourTaxContainer, {marginLeft: Dimensions.get('window').width*-.25}]}>
    //             <Text style={[styles.yourCostText, { color: colors.taxColor }]}>
    //                {userTax.toFixed(2)} {/* Display calculated tax with currency */}
    //             </Text>
    //         </View>
    //     </View>
    // </View>
    <View style={[styles.row, {paddingVertical: 4}]}>
          <View style={[styles.taxRowContainer, { width: netPriceIsSelected ? '98.5%' : '96.2%' }]}>
              <Text style={[styles.itemText, styles.boldText]} numberOfLines={1}>
                  <Text style={styles.bulletPoint}>• </Text> 
                  {proportionalTax 
                      ? `Tax (${((userSubtotal / totalSubtotal) * 100).toFixed(2)}%)` 
                      : `Tax (${((1 / numUsers) * 100).toFixed(0)}%)`}
              </Text>
              <View style={[styles.yourTaxContainer]}>
                  <Text style={[styles.taxText]}>
                      {userTax.toFixed(2)} {/* Display calculated tax */}
                  </Text>
              </View>
          </View>
      </View>
);
};
 
const Row = ({ itemName, storePrice, split, sale, isSelected, netPriceIsSelected, userName, toggleSelect, currency }) => {
  const [splitHeight, setSplitHeight] = useState(0);

  const handleSplitLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    setSplitHeight(height);
  };

  const yourCost = calculateYourCost(storePrice, sale, split);
  const netPrice = calculateNetPrice(storePrice, sale);

  return (
    <View style={[styles.row, {paddingVertical: 1}]}>
      {isSelected && (
        <LinearGradient
          colors={[colors.fadedHighlightColor, colors.highlightColor, colors.fadedHighlightColor]}
          style={styles.gradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      )}
      <View style={netPriceIsSelected ? styles.leftContainerV2 : styles.adjustedWidthContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity onPress={() => toggleSelect(itemName, userName)} activeOpacity={1} style={styles.touchableItem}>
            <Text style={[styles.itemText, isSelected && styles.boldText]} numberOfLines={1}>
              <Text style={styles.bulletPoint}>•</Text> {itemName}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      <View style={netPriceIsSelected ? styles.rightContainerV2 : styles.rightContainerV3}>
        {netPriceIsSelected ? (
          <>
            <View style={styles.storePriceContainer}>
              <Text style={[styles.storePriceText, isSelected && styles.boldText]}>{currency}{storePrice}</Text>
            </View>
            <View style={styles.saleContainer}>
              <Text style={[styles.saleText, isSelected && styles.boldText]}>
                {parseFloat(sale) > 0 ? `-${parseFloat(sale).toFixed(2)}` : `0.00`}
              </Text>
            </View>
            <View style={styles.splitContainer}>
              <Text style={[styles.splitText, isSelected && styles.boldText]} onLayout={handleSplitLayout}>
                {getSplitDisplayNames(split).join(', ')}
              </Text>
            </View>
            <View style={styles.yourCostContainer}>
              <Text style={[styles.yourCostText, isSelected && styles.boldText]}>{currency}{yourCost}</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.netPriceContainer}>
              <Text style={[styles.netPriceText, isSelected && styles.boldText]}>{currency}{netPrice}</Text>
            </View>
            <View style={styles.splitContainerAdjusted}>
              <Text style={[styles.splitText, isSelected && styles.boldText]} onLayout={handleSplitLayout}>
                {getSplitDisplayNames(split).join(', ')}
              </Text>
            </View>
            <View style={styles.yourCostContainerAdjusted}>
              <Text style={[styles.yourCostText, isSelected && styles.boldText]}>{currency}{yourCost}</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};
 
const BreakdownRow = ({ numUsers, item, userSubtotal, totalSubtotal, isExpanded, toggleShowMore, netPriceIsSelected, proportionalTax, tax, currency }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (!item || !item.items || !Array.isArray(item.items)) {
    return <Text>No items to display for {item?.userName || "Unknown User"}.</Text>;
  }

  // console.log("data for BreakdownRow:", item);

  function roundToTwo(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}

  const userTax = proportionalTax ?
      (userSubtotal / totalSubtotal) * tax :
      (tax / numUsers);

  const totalYourCost = roundToTwo(userSubtotal) + roundToTwo(userTax);

  const toggleBreakdown = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setShowBreakdown(!showBreakdown);
  };

  //Helper functions for BreakdownRow
    const getCategoryTotal = (items, category) => { // Use items directly
        let total = 0;
        items.forEach(item => { // Iterate through items
            if (category === 'storePrice') {
                total += parseFloat(item.storePrice);
            } else if (category === 'yourCost') {
                // If yourCost is available directly in the item object
                total += parseFloat(item.yourCost || calculateYourCost(item.storePrice, item.sale, item.split)); // Use calculateYourCost if yourCost not found
            } else if (category === 'sale') {
                total += parseFloat(item.sale);
            }
        });
        return total.toFixed(2);
    };
  

  return (
      <View style={styles.row}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 0 }}>
              <View style={styles.buttonContainerInBreakdown}>
                  <TouchableOpacity style={[styles.expandButton, { width: 60 }]} onPress={toggleShowMore} activeOpacity={1}>
                      <AntDesign name={isExpanded ? 'up' : 'down'} size={15} color="white" />
                  </TouchableOpacity>
              </View>
              
              {netPriceIsSelected ? (
                  <>
                      <View style={styles.breakdownTotalContainer}>
                          <Text style={styles.breakdownTotalText}>Total:</Text>
                         
                      </View>
                      <View style={styles.rightContainer}>
                          <View style={styles.breakdownStoreContainer}>
                              <Text style={styles.breakdownStoreText}>
                                  {currency}{getCategoryTotal(item.items, 'storePrice')} {/* Assuming getCategoryTotal is defined */}
                              </Text>
                          </View>
                          <View style={styles.breakdownSaleContainer}>
                              <Text style={styles.breakdownSaleText}>
                                  -{currency}{getCategoryTotal(item.items, 'sale')} {/* Assuming getCategoryTotal is defined */}
                              </Text>
                          </View>
                          <View style={styles.breakdownCostContainer}>
                              <Text style={styles.breakdownCostText}>
                                  {currency}{totalYourCost.toFixed(2)} 
                              </Text>
                          </View>
                      </View>
                  </>
              ) : (
                <>
                <Text style={styles.breakdownTotalText}>Total: </Text>
                <View style = {{alignItems: 'center', flexDirection: 'row', flex: 1, justifyContent: 'flex-end'}}> 
                
                  {showBreakdown && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.breakdownCostText}>
                        {userSubtotal.toFixed(2)}
                    </Text>
                    <Text style={[styles.breakdownCostText, {paddingRight: 5, color: '#000000'}]}> + </Text>
                    <Text style={[styles.breakdownCostText, { color: colors.taxColor }]}>
                        {userTax.toFixed(2)}
                    </Text>
                    <Text style={[styles.breakdownCostText, {paddingRight: 5, color: '#000000'}]}> = </Text>
                </View>
                    
                  )}
                </View>
                <TouchableOpacity onPress={toggleBreakdown} activeOpacity={1}>
                  <Text style={[styles.clickableText, styles.breakdownCostText2, { color: colors.finalTotalColorGreen }]}>
                    {currency}{totalYourCost.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View> 
        </View>
    );
  };

 
const BottomBar = ({ data, isBottomBarExpanded, toggleBottomBar, currency, tax, proportionalTax, setProportionalTax}) => {
  const numUsers = data.length;
  const totalTax = tax; 
  const totalSubtotal = data.reduce((sum, user) => sum + user.items.reduce((itemSum, item) => itemSum + parseFloat(calculateYourCost(item.storePrice, item.sale, item.split)), 0), 0).toFixed(2);

  const calculateUserTax = (userSubtotal) => {
    if (proportionalTax) {
      return (parseFloat(userSubtotal) / parseFloat(totalSubtotal)) * totalTax;
    } else {
      return numUsers > 0 ? (totalTax / numUsers) : 0;
    }
  };

  const totalsByUser = data.map(user => {
    const userSubtotal = user.items.reduce((sum, item) => {
      return sum + parseFloat(calculateYourCost(item.storePrice, item.sale, item.split));
    }, 0);

    const userTax = calculateUserTax(userSubtotal);

    return {
      userName: user.userName,
      subtotal: userSubtotal,
      tax: parseFloat(userTax.toFixed(2)), // Store tax separately
      total: userSubtotal + parseFloat(userTax.toFixed(2)),
    };
  });

  const totalTotal = proportionalTax ? (parseFloat(totalSubtotal) + totalTax).toFixed(2) : totalsByUser.reduce((sum, user) => sum + parseFloat(user.total), 0).toFixed(2);
  // console.log("totalsByUser:", totalsByUser);

  return (
    <View style={[styles.bottomBarContainer, isBottomBarExpanded && styles.expandedBottomBar]}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={toggleBottomBar} style={styles.bottomBarButton}>
          <AntDesign name={isBottomBarExpanded ? 'down' : 'up'} size={16} color="white" />
          <Text style={styles.bottomBarButtonText}> Breakdown </Text>
          <AntDesign name={isBottomBarExpanded ? 'down' : 'up'} size={16} color="white" />
        </TouchableOpacity>
      </View>

      {isBottomBarExpanded && (
         <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.bottomBarContent, {minWidth: Dimensions.get('window').width * (0.26 * numUsers)}]}>
          <View style={styles.headerRow}>
          <TouchableOpacity
                onPress={() => setProportionalTax(!proportionalTax)}
                style={[styles.proportionalTaxButton, proportionalTax && styles.proportionalTaxButtonActive]}
              >
                <Text style={styles.proportionalTaxButtonText}>{proportionalTax ? 'Relative Tax' : 'Fixed Tax'}</Text>
              </TouchableOpacity>
              {proportionalTax ? (
                <>
                  <View style={styles.allHeaderCell}>
                  <Text style={styles.headerTextBottomBar}>All</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={[styles.allHeaderCell, {width: '18%', marginRight: '1%'}]}>
                  <Text style={styles.headerTextBottomBar}>All</Text>
                  </View>
                </>
              )}
              
            {totalsByUser.map(user => (
              <View key={user.userName} style={styles.userHeaderCell}> 
                <Text numberOfLines={1} style={styles.headerText}>{user.userName}</Text>
              </View>
            ))}
          </View>
         
          <View style={styles.dataRowsContainer}>
            <View style={styles.dataRow}>
              <View style={styles.categoryLabelCell}>  
                <Text style={styles.categoryText}>Subtotal:</Text>
              </View>
              <Text style={[styles.allDataText, { color: colors.yourCostColor }]}>{currency}{parseFloat(totalSubtotal).toFixed(2)}</Text>
              {totalsByUser.map(user => (
                <Text key={user.userName} style={[styles.userDataText, { color: colors.yourCostColor }]}>{currency}{user.subtotal.toFixed(2)}</Text>
              ))}
            </View>
          
            <View style={styles.dataRow}>
              <View style={styles.categoryLabelCell}>
                <Text style={styles.categoryText}>Tax:</Text>
                </View>
                <Text style={[styles.allDataText, { color: colors.taxColor }]}>{currency}{totalTax.toFixed(2)}</Text>
                {totalsByUser.map(user => (
                  <Text key={user.userName} style={[styles.userDataText, { color: colors.taxColor }]}>{currency}{user.tax}</Text>
                ))}
              </View>
            
            <View style={styles.dataRow}>
              <View style={styles.categoryLabelCell}>
                <Text style={styles.categoryText}>Total:</Text>
              </View>
              <Text style={[styles.allDataText, {color: colors.finalTotalColor, fontWeight: 'bold', fontSize: 16}]}>{currency}{totalTotal}</Text>
              {totalsByUser.map(user => (
                <Text key={user.userName} style={[styles.userDataText, {color: colors.finalTotalColor, fontWeight: 'bold', fontSize: 16}]}>{currency}{user.total.toFixed(2)}</Text>
              ))}
            </View>
          </View>
        </View>
        </ScrollView>
      )}
    </View>
  );
};
 
const Container = ({ item, selectedItem, toggleSelectItem, proportionalTax, tax, numUsers, totalSubtotal }) => {
  const [expanded, setExpanded] = useState(false);
  const [netPriceIsSelected, setNetPriceIsSelected] = useState(false); // Add netPriceIsSelected state
  // Toggle show more/less
  // console.log("item for Container:" + item);
    // IMPORTANT: Check the structure of item and item.items!
    if (!item || !item.items || !Array.isArray(item.items)) {
      console.error("Invalid item data in Container:", item);  // Log the problematic item
      return <Text>Invalid item data for {item?.userName || "Unknown User"}</Text>;
    }
  const toggleShowMore = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); // <-- LayoutAnimation here
    setExpanded(prev => !prev);
  };

   // Toggle netPriceIsSelected
   const toggleNetPrice = () => {
    setNetPriceIsSelected(prev => !prev);
  };

    // Reset to Net Price, Split, and Owed when Sale or Retail is clicked
    const resetToDefault = () => {
      setNetPriceIsSelected(prev => !prev);
    };

  // const numUsers = data.length;
  // const totalTax = tax;
  // const totalSubtotal = item.items.reduce((sum, i) => // changed to i from item
  // sum + parseFloat(calculateYourCost(i.storePrice, i.sale, i.split)), 0).toFixed(2);

  const userSubtotal = item.items.reduce((sum, i) =>
      sum + parseFloat(calculateYourCost(i.storePrice, i.sale, i.split)),
      0
  );

  
  // const userTax = (userSubtotal / parseFloat(totalSubtotal)) * totalTax; // is this used?
    // const formattedUserTax = userTax.toFixed(2); // Format to two decimal places

//add in line 578 if net Price is not selected, then width = 180 but if it is userNameContainer width = 160 with overflow = elipsis
  return (

    <View style={styles.innerContainer}>
    <View style={styles.headerContainer}>
    {netPriceIsSelected ? (
          <>
          <View style={[styles.userNameContainer, {marginLeft: '-2.5%', width: '42.25%', marginRight: '8%'}]}>
            <Text numberOfLines={1} style={styles.userNameText}>  {item.userName.slice(0, 10)}</Text>
          </View>
              <TouchableOpacity onPress={resetToDefault} style={styles.storePriceHeaderContainer}>
                <Text style={[styles.headerText, styles.clickableText]}>Retail</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={resetToDefault} style={styles.saleHeaderContainer}>
                <Text style={[styles.headerText, styles.clickableText]}>Sale</Text>
              </TouchableOpacity>
              <View style={styles.splitHeaderContainer}>
                <Text style={styles.headerText}>Split</Text>
              </View>
             <View style={styles.yourCostHeaderContainer}>
                <Text style={styles.headerText}>Owed</Text>
              </View>
            </>
          ) : (
            // Alternate layout: Show Sale and Retail, which can reset back to default on click
            <>
          <View style={[styles.userNameContainer, {minWidth: '52%', maxWidth: '52%'}]}>
            <Text numberOfLines={1} style={styles.userNameText}>{item.userName}</Text>
          </View>
             <TouchableOpacity onPress={toggleNetPrice} style={styles.netPriceHeaderContainer}>
                <Text style={[styles.clickableText, styles.headerText, netPriceIsSelected && styles.selectedText]}>Net Price</Text>
              </TouchableOpacity>
              <View style={styles.splitHeaderContainerAdjusted}>
                <Text style={styles.headerText}>Split</Text>
              </View>
              <View style={styles.yourCostHeaderContainerAdjusted}>
                <Text style={styles.headerText}>Owed</Text>
              </View>
            </>
          )}
        </View>

         {/* Display data rows */}
         {item.items.slice(0, expanded ? item.items.length : 3).map((i, index) => (
          <Row
            key={index}
            itemName={i.itemName}
            storePrice={i.storePrice}
            // yourCost={item.yourCost}
            split={i.split}
            sale={i.sale === undefined ? 0.00 : i.sale}
            isSelected={selectedItem === i.itemName} // Pass selectedItem state
            toggleSelect={toggleSelectItem} // Pass toggleSelectItem function
            netPriceIsSelected={netPriceIsSelected}
            userName = {item.userName}
            currency={currency}
          />
        ))}

        <TaxRow 
        item={item}
        tax={tax} 
        numUsers={numUsers} 
        userSubtotal={userSubtotal}
        totalSubtotal={totalSubtotal}
        netPriceIsSelected={netPriceIsSelected}
        proportionalTax={proportionalTax} // Pass the percentage as a string
      />
        {/* Horizontal line above BreakdownRow */}
        <View style={styles.horizontalLine} />

        {/* Display Breakdown row with calculated values */}
        <BreakdownRow numUsers={numUsers} userSubtotal={userSubtotal} totalSubtotal={totalSubtotal} currency={currency} tax={tax} item={item} isExpanded={expanded} toggleShowMore={toggleShowMore} netPriceIsSelected={netPriceIsSelected} proportionalTax={proportionalTax}/>
      </View>
    
  );
};
 
const NavigationBar = ({ numUsers, setSelectedPayer, selectedPayer, proportionalTax, totalSubtotal, data, title, modalVisible, selectedOption, closeModal, soloMessageButton, setModalVisible, setSelectedOption, setData1, currency, tax }) => {
  const [dropdownVisible, setDropdownVisible] = React.useState(false);
  const [contactMethod, setContactMethod] = useState(null);
  const [venmoUsernameInput, setVenmoUsernameInput] = useState('');
  const [venmoUsername, setVenmoUsername] = useState(''); // Use state for venmoUsername
  const navigation = useNavigation();

  const [venmoPaymentInfo, setVenmoPaymentInfo] = useState({});  // To store venmo username
  const [selectedAction, setSelectedAction] = useState(null); // To track selected action
  const [selectedPayerName, setSelectedPayerName] = useState(null); // Store selected payer's userName

    const handlePayerSelect = (user) => {
      setSelectedPayer(user);
      setSelectedPayerName(user.userName); // Update selected payer's name
      setVenmoPaymentInfo(prevInfo => ({
          ...prevInfo,
          [user.userName]: {
              method: (prevInfo[user.userName]?.method) || 'phone', // Preserve previous method if it exists
              username: (prevInfo[user.userName]?.username) || user.phoneNumber // Preserve Venmo username
          }
      }));

  };

  const handleVenmoInfoChange = (newVenmoUsername, payerName) => {
      Keyboard.dismiss();
      setVenmoPaymentInfo(prevInfo => ({
          ...prevInfo,
          [payerName]: {  // Use payerName as the key
              method: 'venmo',
              username: newVenmoUsername
          }
      }));

      if (payerName === 'Self' && selectedPayer && selectedPayer.userName === 'Self') {
        setData1(data.map(user => 
            user.userName === 'Self' ? { ...user, phoneNumber: newVenmoUsername } : user
        ));
    }
};


useEffect(() => {
  if (selectedPayerName) { // Use selectedPayerName
      const selectedUser = data.find(user => user.userName === selectedPayerName);

      if (selectedUser) {
          setSelectedPayer(selectedUser);
          const paymentInfo = venmoPaymentInfo[selectedPayerName]; // Use selectedPayerName


          if (paymentInfo) {
              setContactMethod(paymentInfo.method);
              if (paymentInfo.method === 'venmo') {
                  setVenmoUsernameInput(paymentInfo.username);
              }
          } else {
              setContactMethod('phone');
              setVenmoUsernameInput(selectedUser.phoneNumber); // Set to phone number initially
          }
          setVenmoUsername(selectedUser.phoneNumber); // Only if using the phone number
      }
  }
}, [selectedPayerName, data, venmoPaymentInfo]); // selectedPayerName as dependency

  // Function to go back
  const handleGoBack = () => {
    console.log("Go Backward pressed!");
    navigation.goBack();
  };

  // Example of calculateOwedAmount function
  const calculateOwedAmount = (userName) => {
    const user = data.find(u => u.userName === userName);
    if (!user) {
        console.error("User not found:", userName);
        return 0;
    }

    const userSubtotal = user.items.reduce((sum, item) => {
        const cost = parseFloat(calculateYourCost(item.storePrice, item.sale, item.split));
        console.log('Item cost:', item.itemName, cost);
        return sum + cost;
    }, 0);
    
    // Calculate tax proportion
    const userTax = proportionalTax ?
      (userSubtotal / totalSubtotal) * tax :
      (tax / numUsers); 
    console.log("userTax in NavigationBar" + userTax);
    return (userSubtotal + userTax).toFixed(2);
};

// const createVenmoLink = (amount, note, recipient) => { // Add recipient argument
//   // return `venmo://paycharge?txn=pay&recipients=${recipient}&amount=${amount}¬e=${encodeURIComponent(note)}`;
//   return `venmo://paycharge?txn=pay&recipients=${recipient}&amount=${amount}&note=${encodeURIComponent(note)}`;
// };

const createVenmoLink = (amount, note, recipient) => {

  let formattedUsername = recipient;
  
  // Check if it's a phone number (contains numbers)
  if (/\d/.test(venmoUsername)) {
      // Remove +1 prefix if it exists
      formattedUsername = formattedUsername.replace(/^\+1-?/, '');
      
      // Remove leading 1 if it exists
      formattedUsername = formattedUsername.replace(/^1-?/, '');
      
      // Get only the last 10 digits plus any dashes between them
      const digits = formattedUsername.replace(/\D/g, '').slice(-10);
      if (digits.length === 10) {
          // Keep original dashes if they exist in the correct positions
          formattedUsername = formattedUsername.slice(-12); // account for possible dashes
      }
  }
  console.log(formattedUsername);
  return `venmo://paycharge?txn=pay&recipients=${formattedUsername}&amount=${amount}&note=${encodeURIComponent(note)}`;
};

  const sendIndividualMessage = async (recipient) => { // Recipient passed as argument
    if (!selectedPayer) {
        console.error("No payer selected");
        return;
    }

    const owedAmount = calculateOwedAmount(recipient.userName);

    const payerVenmoInfo = venmoPaymentInfo[selectedPayer.userName] || { method: 'phone', username: selectedPayer.phoneNumber };

    let venmoRecipient = payerVenmoInfo.method === 'venmo' ? payerVenmoInfo.username : selectedPayer.phoneNumber;
    const venmoLink = createVenmoLink(owedAmount, `Grocery Bill for ${recipient.userName}`, venmoRecipient); // Pass recipient

    const message = `Hey ${recipient.userName}, you owe $${owedAmount}. Click the link to pay on Venmo: ${venmoLink}. Thanks for using Divvy!`;


    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
        await SMS.sendSMSAsync([recipient.phoneNumber], message); // Use recipient.phoneNumber
    } else {
      alert('SMS not available. Opening Venmo directly...');
      Linking.openURL(venmoLink);
    }
      setModalVisible(false);
  };

  const sendGroupMessage = async () => {
    let combinedMessage = '';
    for (const user of data) {
        if (user.userName !== selectedPayer.userName) { // Don't send message to self
            const owedAmount = calculateOwedAmount(user.userName);

            const recipient = venmoPaymentInfo[selectedPayer.userName]?.method === 'venmo' ? venmoPaymentInfo[selectedPayer.userName].username : selectedPayer.phoneNumber
            const venmoLink = createVenmoLink(owedAmount, `Grocery Bill for ${user.userName}`, recipient);

            combinedMessage += `Hey ${user.userName}, you owe $${owedAmount}. Click the link to pay on Venmo: ${venmoLink}.\n\n`;
        }
    }

    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
      await SMS.sendSMSAsync(data.map(user => user.phoneNumber), combinedMessage);  // Send to multiple numbers
    } else {
      alert('SMS not available');
      // Handle what to do if SMS isn't available, maybe open a single Venmo link?
    }
    setModalVisible(false);
  };
  // Load Venmo icon
  const VenmoIcon = require('../assets/Venmo_Logo_App.png');
  const VenmoIconComponent = <Image source={VenmoIcon} style={styles.venmoIcon} resizeMode="contain" />;

    // Custom RadioButton component
  const RadioButton = ({ value, status, onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.radioButton}>
      <View style={[styles.radioCircle, status === 'checked' && styles.radioCircleChecked]} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.navigationBar}>
      {/* Left Navigation Container */}
      <View style={styles.leftNavContainer}>
        <TouchableOpacity onPress={handleGoBack} style={styles.navButton}>
          <AntDesign name="left" size={20} color="black" />
        </TouchableOpacity>
      </View>

      {/* Center Title */}
      <View style={styles.navTitleContainer}>
        <Text style={[styles.navTitleText]}>{title}</Text>
      </View>

      {/* Right Navigation Container */}
      <View style={styles.rightNavContainer}>
        <TouchableOpacity onPress={soloMessageButton} style={styles.navButton}>
          {VenmoIconComponent}
        </TouchableOpacity>

        {/* Modal for Options */}
        <Modal
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
          animationType="slide"
        >
          <TouchableOpacity style={styles.modalBackground} onPress={closeModal} activeOpacity={1}>
            <View style={styles.modalContainer}>

              {/* Select Who Paid Section */}
              <Text style={styles.modalTitle}>Select Who Paid</Text>
              <View style={[styles.dropdownContainer, {}]}>
                <TouchableOpacity onPress={() => setDropdownVisible(!dropdownVisible)} style={styles.dropdownButton}>
                  <Text style={styles.dropdownButtonText}>
                    {selectedPayerName ? 
                      data.find(user => user.userName === selectedPayerName)?.userName + ' - ' + 
                      data.find(user => user.userName === selectedPayerName)?.phoneNumber 
                      : 'Select a Person'}
                  </Text>
                  <AntDesign name={dropdownVisible ? 'up' : 'down'} size={16} color="#007BFF" />
                </TouchableOpacity>
                {dropdownVisible && (
                  <View style={styles.dropdownMenu}>
                    {data.map((user, index) => (
                      <View key={index}>
                        <TouchableOpacity
                          style={[
                            styles.dropdownMenuItem,
                            selectedPayerName === user.userName && styles.selectedMenuItem,
                          ]}
                          onPress={() => {
                            handlePayerSelect(user);
                            setDropdownVisible(false);
                          }}
                        >
                          {selectedPayerName === user.userName ? (
                            <LinearGradient
                              colors={[colors.fadedHighlightColor, colors.highlightColor, colors.fadedHighlightColor]}
                              style={[styles.gradientDropDown, { height: styles.dropdownMenuItem.height }]}
                              start={{ x: 0.5, y: 0 }}
                              end={{ x: 0.5, y: 1 }}
                            >
                              <Text style={[styles.dropdownMenuItemText, styles.selectedMenuItemText]}>
                                {user.userName} - {user.phoneNumber}
                              </Text>
                            </LinearGradient>
                          ) : (
                            <Text style={styles.dropdownMenuItemText}>{user.userName} - {user.phoneNumber}</Text>
                          )}
                        </TouchableOpacity>
                        {index < data.length - 1 && <View style={styles.separator} />}
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View style={[styles.modalHorizontalLine, {marginTop: 14, width: '100%'}]}></View>

              {/* Contact Method Choice */}
              {selectedPayerName && ( 
                <View style={{width: '100%'}}>
                  <Text numberOfLines={2} ellipsizeMode="tail" style={[styles.modalTitle, {marginTop: 14, width: '100%'}]}>
                    Choose {data.find((user) => user.userName === selectedPayerName)?.userName}'s Preference
                  </Text>
                  <View style={styles.contactMethodGrid}>
                  <TouchableOpacity
                    style={[
                      styles.contactMethodGridItem,
                      contactMethod === 'phone' && styles.selectedContactMethodPhoneNumber,
                    ]}
                    onPress={() => setContactMethod('phone')}
                  >
                    <Text style={styles.contactMethodText}>Phone Number</Text>
                    <Text style={styles.contactMethodSubtext}>
                        (Assume Phone number is associated with {data.find((user) => user.userName === selectedPayerName)?.userName}'s Venmo)
                    </Text>
                     </TouchableOpacity>
                   <TouchableOpacity
                            style={[
                              styles.contactMethodGridItem,
                              contactMethod === 'venmo' && styles.selectedContactMethodVenmoAccount,
                            ]}
                            onPress={() => setContactMethod('venmo')}
                          >
                           <Text style={styles.contactMethodText}>Venmo Account</Text>
                           <Text style={styles.contactMethodSubtext}>
                              (Enter {data.find((user) => user.userName === selectedPayerName)?.userName}'s Venmo account username instead)
                             </Text>
                  </TouchableOpacity>
                  </View>

                  {/* Venmo Input (Conditional) */}
                  {contactMethod === 'venmo' ? (
                    <View style={styles.venmoInputContainer}>
                      <Text style={styles.venmoInputLabel}>
                        Enter {data.find((user) => user.userName === selectedPayerName)?.userName}'s Venmo Username
                      </Text>
                      <View style={styles.inputWithCheck}>
                          <TextInput
                              style={[styles.venmoInput, styles.inputFill]}
                              placeholder="Venmo Username"
                              value={venmoUsernameInput}
                              onChangeText={(text) => setVenmoUsernameInput(text)}
                              placeholderTextColor="gray"
                          />
                          <TouchableOpacity
                          style={styles.checkMarkContainer}
                          onPress={() => {handleVenmoInfoChange(venmoUsernameInput, selectedPayerName); setVenmoUsernameInput('');}}
                          >
                           <AntDesign name="checksquareo" size={24} color="green" />
                          </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}
                </View>
              )}



              <View style={[styles.modalHorizontalLine, {marginTop: 16, width: '100%'}]}></View>

              {/* Modal Title */}
              <Text style={[styles.modalTitle, { marginTop: 14, marginBottom: 14 }]}>Choose an Action</Text>

              {/* Group Chat Option */}
              <View style={styles.radioContainer}>
                <RadioButton
                  value="groupChat"
                  status={selectedAction === 'groupChat' ? 'checked' : 'unchecked'}
                  onPress={() => {
                    setSelectedAction('groupChat');
                    sendGroupMessage();
                  }}
                />
                <Text style={styles.radioLabel}>Send All Links via Group Chat</Text>
              </View>

              {/* Individual User Options */}
              {data.filter(user => user.userName !== 'Self').map((user, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.radioContainer}
                  onPress={() => {
                    setSelectedAction(`individual-${user.userName}`);
                    sendIndividualMessage(user);
                  }}
                >
                  <RadioButton
                    value={`individual-${user.userName}`}
                    status={selectedAction === `individual-${user.userName}` ? 'checked' : 'unchecked'}
                  />
                  <Text style={styles.radioLabel}>Send Venmo Link to {user.userName}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </View>
  );
};
 
// FlatList in the main App
export default function Breakdown() {
  const route = useRoute();  
  const [selectedItem, setSelectedItem] = useState(null); // Track which row is selected
  const [selectedUserName, setSelectedUserName] = useState(null)
  const [isBottomBarExpanded, setIsBottomBarExpanded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null); // Track the selected radio button
  const [proportionalTax, setProportionalTax] = useState(false); // Add this state
  const [selectedPayer, setSelectedPayer] = useState(null);
  const navigation = useNavigation();

  const initialData = route.params?.updatedData;

if (!initialData || !initialData.receiptEndVariables) {
    return (
      <View>
        <Text>Loading...</Text> 
      </View>
    );
  }

const { subtotal, tax: initialTax, total } = initialData.receiptEndVariables; // Rename to initialTax
const [tax, setTax] = useState(initialTax); // Use initialTax here
const [data1, setData1] = useState(initialData);

// console.log("initialData:" + initialData);

  const toggleBottomBar = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsBottomBarExpanded(prev => !prev);
  };

  // Update toggleSelect to handle multiple users:
  const toggleSelect = (itemName, userName) => {
    if (selectedItem === itemName && selectedUserName === userName) {
      setSelectedItem(null);
      setSelectedUserName(null);
    } else {
      setSelectedItem(itemName);
      setSelectedUserName(userName); // Keep track of selected userName
    }
  };

  const soloMessageButton = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  useEffect(() => {
    if (initialData && Array.isArray(initialData)) {  // Check if it's an array
      setData1(initialData);
  
      if (initialData.receiptEndVariables && initialData.receiptEndVariables.tax) {
        setTax(parseFloat(initialData.receiptEndVariables.tax));
      } else {
        console.warn("Tax data not found in initialData.receiptEndVariables");
      }
    } else {
      console.warn("Initial data is invalid or empty:", initialData);
      setData1([]); // Set a default empty array
    }
  }, [initialData]);

  const totalSubtotal = data1.reduce((sum, user) => {
    if (!user || !user.items || !Array.isArray(user.items)) { // check user data integrity
        console.error("Invalid user data in totalSubtotal calculation:", user);
        return sum;
      }
      return sum + user.items.reduce((userSum, item) =>
        userSum + parseFloat(calculateYourCost(item.storePrice, item.sale, item.split)), 0
      );
  }, 0);

  return (
    <View style={styles.pageBackground}>
     
    <NavigationBar 
      title="Payment Summary" 
      modalVisible={modalVisible} 
      selectedOption={selectedOption} 
      closeModal={closeModal} 
      soloMessageButton={soloMessageButton} 
      setModalVisible={setModalVisible} 
      setSelectedOption={setSelectedOption}
      data={data1}
      totalSubtotal={totalSubtotal}
      setData1={setData1}
      currency={currency}
      tax={tax}
      proportionalTax={proportionalTax}
      numUsers={data1.length}
      selectedPayer={selectedPayer}
      setSelectedPayer={setSelectedPayer}
    />
      <View style={{ flexGrow: 1}}>
        <FlatList  style={{flex: 1}}
          data={data1} // Use the DATA array
          renderItem={({ item }) => (
            <Container
              item={item}
              numUsers={data1.length}
              selectedItem={selectedItem}
              toggleSelectItem={(itemName) => toggleSelect(itemName, item.userName)}  // Pass userName to toggleSelect
              keyExtractor={(item) => item.userName} // Key by userName
              currency={currency}
              proportionalTax={proportionalTax}
              tax={tax}
              totalSubtotal={totalSubtotal}
            />
          )}
          keyExtractor={(item) => item.userName} // Key by userName
          contentContainerStyle={[styles.flatListContent]}
        />
        </View>
        <BottomBar 
                  data={data1}
                  isBottomBarExpanded={isBottomBarExpanded} 
                  toggleBottomBar={toggleBottomBar} 
                  proportionalTax={proportionalTax} // Added missing prop here
                  setProportionalTax={setProportionalTax} // added this 
                  tax={tax}
              />
      </View>
  );
};
 
const styles = StyleSheet.create({
  pageBackground: {
    flex: 1,
    backgroundColor: colors.backgroundColorBehindCard, // Background color
    paddingVertical: 0,
    paddingHorizontal: 2,
  },
  boldText: {
    fontWeight: 'bold', // Makes text bold
  },
  gradient: {
    position: 'absolute', // Position absolute to cover the row
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8, // Optional: Add if your rows have rounded corners
  },
  flatListContent: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  innerContainer: {
    backgroundColor: colors.cardColor,
    marginVertical: 10,
    padding: 10,
    borderRadius: 20,
    width: '99.8%',
    paddingBottom: 3,
    //overflow: 'hidden',
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    // Shadow for Android
    elevation: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5, // Add spacing after the header row
  },
  leftContainerBreakdownRow: { //got rid of flex 1
    flexDirection: 'row',
    paddingRight: 10,
    maxWidth: 150,
    marginLeft: 10,
  },
  leftContainer: {
    position: 'absolute',  // Fixed position on the left
    zIndex: 1,  // Ensure the itemName stays above the scrollable content
    flex: 1,
    paddingRight: 10,
    maxWidth: 150,
  },
  leftContainerV2: {
    flex: 1,
    paddingRight: 0,
    maxWidth: '40.0%',
    minWidth: '30%',
    marginLeft: 4,
    paddingHorizontal: 2,
  },
  taxRowContainer: {
    flexDirection: 'row',
    flex: 1,
    // flex: 1,
    // width: '96%',
    marginLeft: '0%',
    justifyContent: 'space-between', // Distribute space between children
    paddingHorizontal: 0,
},
adjustedWidthContainer: {
  flex: 1,
  paddingRight: 0,
  minWidth: '40%', //195
  maxWidth: '47.5%',
  marginLeft: '1%',
  marginRight: '5%',
  paddingHorizontal: 2,
},
  rightContainer: {
    flexDirection: 'row', // Align the data in row format
    justifyContent: 'space-between',
    flex: 1,
    marginLeft: 0,
  },
  rightContainerV2: {
    flexDirection: 'row', // Align the data in row format
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: '0%',
  },
  rightContainerV3: {
    flexDirection: 'row', // Align the data in row format
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: '3%',
  },
  expandedDataContainer: {
    maxWidth: '100%', // Expand to fit content when expanded
    // height: 15,// Remove fixed height when expanded
    paddingHorizontal: 2, // Consistent padding
  },
  // Individual containers for each field in the right container
  netPriceContainer: {
    // marginLeft: Dimensions.get('window').width*-0.0005,
    // width: 50,
    width: Dimensions.get('window').width*.15,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  yourCostContainer: {
    marginLeft: 0,
    marginRight: '2%',
    // width: 50,
    width: Dimensions.get('window').width*.13,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  yourTaxContainer: {
    // marginLeft: 0,
    // width: 50,
    alignItems: 'flex-end',
    paddingRight: '3%',
    flex: 1,
    justifyContent: 'center',
  },
  yourCostContainerAdjusted: {
    marginLeft: 0,
    // width: 50,
    width: Dimensions.get('window').width*.13,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  splitContainer: {
    // width: 60,
    width: Dimensions.get('window').width*.13,
    marginLeft: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splitContainerAdjusted: {
    // width: 60,
    width: Dimensions.get('window').width*.13,
    marginLeft: Dimensions.get('window').width*.026,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saleContainer: {
    width: Dimensions.get('window').width*.13,
    // width: 54,
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginLeft: -2,
  },
  storePriceContainer: {
    // width: 50,
    width: Dimensions.get('window').width*.13,
    // marginLeft:5,
    marginLeft: Dimensions.get('window').width*.001,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  yourCostHeaderContainer: {
    // width: 70,
    width: Dimensions.get('window').width*.17,
    marginLeft: Dimensions.get('window').width*.005,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yourCostHeaderContainerAdjusted: {
    // width: 70,
    width: Dimensions.get('window').width*.20,
    marginLeft: '-1.5%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  netPriceHeaderContainer: {
    width: Dimensions.get('window').width*.16,
    marginLeft: '-2.1%',
    // marginLeft: 4,
    // marginLeft: Dimensions.get('window').width*.045,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splitHeaderContainer: {
    // width: 40,
    width: Dimensions.get('window').width*.09,
    // marginLeft: 4,
    marginLeft: Dimensions.get('window').width*.025,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splitHeaderContainerAdjusted: {
    // width: 40,
    width: Dimensions.get('window').width*.11,
    // marginLeft: 4,
    marginLeft: Dimensions.get('window').width*.01,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saleHeaderContainer: {
    // width: 40,
    width: Dimensions.get('window').width*.09,
    // marginLeft: 19,
    marginLeft: Dimensions.get('window').width*.043,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storePriceHeaderContainer: {
    // width: 40,
    width: Dimensions.get('window').width*.10,
    // marginLeft: 17,
    marginLeft: Dimensions.get('window').width*-0.055,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulletPoint: {
    fontSize: 20,
  },
  itemContainer: {
    alignItem: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 16,
    color: '#545353',
    // fontWeight: 'bold',
    fontFamily: fonts.itemFont,
  },
  netPriceText: {
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'right',
    color: 'black',
  },
  clickableText: {
    textDecorationLine: 'underline',
    textDecorationColor: '#ADD8E6', // Light blue color for underline
    textDecorationStyle: 'solid', // Makes the underline solid
    textDecorationThickness: 1.5, // Increase for a thicker underline
    textDecorationOffset: 20, // Adjust this value to position the underline lower
  },
  yourCostText: {
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'right',
    color: colors.yourCostColor,
  },
  taxText: {
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'right',
    color: colors.taxColor,
  },
  splitText: {
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'center',
    whiteSpace: 'nowrap', // Prevents text wrapping
    overflow: 'hidden',   // Ensures overflow is hidden
    textOverflow: 'ellipsis', // Adds ellipsis when text overflows
  },
  saleText: {
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'right',
    color: colors.saleColor,
  },
  storePriceText: {
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'right',
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  userNameContainer: {
    // width: 180,
    justifyContent: 'center',
    paddingLeft: 10,
  },
  userNameText: {
    fontSize: 23,
    fontWeight: 'bold',
    textAlign: 'left',
    overflow: 'hidden',   // Ensures overflow is hidden
    textOverflow: 'elipsis', // Adds ellipsis when text overflows
  },
  buttonContainerInBreakdown: {
    flexDirection: 'row',  // Align "Show More" and "Totals:" side by side
    alignItems: 'center',
  },
  expandButton: {
    backgroundColor: '#4f65b1', //old is #007BFF
    padding: 6,
    marginRight: 10,  // Space between button and "Totals:"
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandButtonText: {
    color: '#FFFFFF', // Button text color
    fontWeight: 'bold',
  },
  breakdownTotalContainer: {
    flexDirection: 'row',
    marginLeft: 0,
    marginVertical: 3,
  },
  breakdownTotalContainer2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  totalContentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
   breakdownTotalText: {
    fontSize: 19,
    fontWeight: 'bold',
    textAlign: 'left',
    marginRight: 10,
    letterSpacing: 1,
  },
  breakdownCostContainer: {
    // marginLeft: Dimensions.get('window').width*-.1,
    // flex: 1/.5,
    marginVertical: 7, 
    alignItems: 'center', // Align with 'Your Cost' column
  },
  breakdownCostContainerAdjusted: {
    width: Dimensions.get('window').width*.536,
    // flex: 1/.3,
    marginVertical: 4, 
    alignItems: 'center',
  },
  breakdownSaleContainer: {
    // marginLeft: 0,
    // flex: 1/.5,
    // marginLeft: Dimensions.get('window').width*.0001,
    marginVertical: 7, 
    alignItems: 'center', // Align with 'Sale' column
  },
  breakdownStoreContainer: {
    // marginLeft: 0,
    // flex: 1/.5,
    // marginLeft: -10,
    marginVertical: 7, 
    alignItems: 'center', // Align with 'Store Price' column
  },
  breakdownCostText: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'right',
    color: colors.yourCostColor,
  },
  breakdownCostText2: {
    paddingLeft: 5,
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'right',
    color: colors.yourCostColor,
  },
  breakdownStoreText: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  breakdownSaleText: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'right',
    color: colors.saleColor,
  },
  horizontalLine: {
    borderBottomColor: '#ccc', // Choose the color of the line
    borderBottomWidth: 1,      // Thickness of the line
    marginVertical: 1,        // Space around the line (optional)
  },
  bottomBarContainer: { //default style for bottom bar
    flexDirection: 'row',
    padding: 10,
    backgroundColor: colors.breakdownColor, //similar card color
    alignItems: 'center',
    justifyContent: 'center',
    alignContent: 'center',
    borderRadius: 15, //give it rounded corners
    maxHeight: 80,
    width: Dimensions.get('window').width,
    position: 'absolute', //so that it sits at the bottom of the screen
    bottom: 0, //add bottom 0
    borderWidth: 1, 
    borderColor: 'black',
  },
  buttonContainer: {     // Styles for the button's container
    position: 'absolute', // Position absolutely
    top: -17,             // Adjust top value to position above content
    alignSelf: 'center',  // Center horizontally within bottomBarContainer
    zIndex: 1,           // Ensure button is above other content
  },
  expandedBottomBar: { //styles applied when expanded
    maxHeight: 150, //remove max height when expanded
    padding: 10,
    alignContent: 'center',
    justifyContent: 'center',
    borderWidth: 1, 
    borderColor: 'black',
  },
  bottomBarButton: { //style for button to expand bar
    flexDirection: 'row',
    backgroundColor: '#aa61f9', //make background blue
    padding: 6,
    borderRadius: 50, //round button corners
    alignItems: 'center', //center button content
  },
  bottomBarButtonText: { //styles for text in button
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  bottomBarContent: {
    marginTop: 15,
  },
  headerRow: { // Styles for the header row
    flexDirection: 'row',
    marginBottom: 5,
  },
  emptyHeaderCell: { // Empty cell for spacing
    minWidth: 77,   // Adjust width as needed
    marginRight: 0,
  },
  allHeaderCell: {  // "All" header cell
    width: '12%',
    marginRight: '3%',
    justifyContent: 'center',
  },
  userHeaderCell: { // User header cells
    minWidth: 64,
    maxWidth: 64,
    marginLeft: 10,
    justifyContent: 'center',
  },
  headerTextBottomBar: {
    fontSize: 16,
    fontFamily: 'monospace',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  dataRowsContainer: {
    // Container for the data rows
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 5,
    marginLeft: 0,
  },
  categoryLabelCell: { // Cell for the category labels ("Subtotal:", etc.)
    width: 72,
    marginRight: 0,
  },
  categoryText: {   // Style for the category labels
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  allDataText: {     // "All" data
    minWidth: 64,
    maxWidth: 64,
    marginRight: 0,
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'right',
  },
  userDataText: { // Individual user data
    flex: 1,
    minWidth: 64,
    maxWidth: 64,
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'right',
    marginLeft: 10,  // Adjust as needed
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop:  Platform.OS === 'ios' ? 27: 27, // Handle padding for different OS
    paddingBottom: 0,
    backgroundColor: '#f0f0f0', // Light gray background
    borderBottomWidth: 1,
    borderBottomColor: '#ddd', // Light gray border
    elevation: 5, //for shadow on the navigation bar
  },
  navButton: {
    padding: 10,
  },
  navTitleContainer: {
    // flex: 1,
    // alignSelf: 'center',
    // justifyContent: 'center',
    // alignItems: 'center',
    // flexDirection: 'row',
    flex: 1,
    alignItems:'center',
    justifyContent: 'center',

  },
  navTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  venmoLogo: {
    width: 70,  // Adjust width as needed
    height: 35, // Adjust height as needed
    marginRight: 0, // Add some spacing between the image and the button
  },
  venmoIcon:{
    width: 120,  // Adjust width as needed
    height: 35, // Adjust height as needed
    marginRight: 0
  },
  leftNavContainer:{
    alignItems: 'flex-start',
    width: 40
    // flexDirection: 'row',
    // maxWidth: '20%',
  },
  rightNavContainer:{
    // flexDirection: 'row',  // Align image and button horizontally
    // alignItems: 'center',   // Center vertically
    // maxWidth: '20%',
    width: 40,
    alignItems: 'center'
  },
  proportionalTaxButton: {
    backgroundColor: 'grey',
    borderRadius: 5,
    padding: 5,
    minWidth: '20%',
    maxWidth: '45%',
    marginRight: '2%',  // Add some margin
  },
  proportionalTaxButtonActive: {
    backgroundColor: 'green',
  },
  proportionalTaxButtonText: {
    color: 'white',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'flex-start', // Align everything to the left
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'center', // Center the title text
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  radioLabel: {
    fontSize: 16,
    marginLeft: 10,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
  },
  radioCircleChecked: {
    backgroundColor: '#007BFF',
  },
  dropdownContainer: {
    position: 'relative',
    marginBottom: 2,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    width: '100%',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 42,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    padding: 10,
    zIndex: 10,
  },
  dropdownMenuItem: {
    paddingVertical: 10,
    height: 38,
  },
  selectedMenuItemText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16, // Adjust based on your design needs

  },
  gradientDropDown: {
    position: 'absolute', // Position absolute to cover the row
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8, // Optional: Add if your rows have rounded corners
    justifyContent: 'center', // Centers the content vertically
    alignItems: 'center', // Centers the content horizontally
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: '#d3d3d3',
    marginHorizontal: 5, // Optional: adds space between line and edges
  },
  dropdownMenuItemText: {
    fontSize: 16,
    color: '#000',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#000',
  },
  contactMethodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',  // Distribute items evenly
    marginTop: -6,
    alignItems: 'flex-start',
    width: '100%', 
  },
  contactMethodGridItem: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 5,
    borderRadius: 10,
    // width: '100%',
    height: 90,
    flex: 1, // Take up equal width
    marginHorizontal: 3,  // Small spacing between items
    alignItems: 'center', // Center text vertically and horizontally
    
  },
  selectedContactMethodPhoneNumber: {
    backgroundColor: '#b6fbbb', // Or another highlight color
    borderColor: "#6e6e6e",
  },
  selectedContactMethodVenmoAccount: {
    backgroundColor: colors.highlightColor, // Or another highlight color
    borderColor: '#6e6e6e',
  },
  contactMethodText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactMethodSubtext: {
    fontSize: 12,
    color: '#666', // Slightly lighter text color
  },
  modalHorizontalLine: {
    borderBottomColor: '#ccc', // Choose the color of the line
    borderBottomWidth: 1.5,      // Thickness of the line
    marginVertical: 1,
  },
  venmoInputContainer: {
    marginTop: 10,  // Add some spacing
  },
  venmoInputLabel: {
    color: 'red',
    fontWeight: '500',
    marginBottom: 5,
    fontSize: 13,
    alignSelf: 'center', 
  },
  venmoInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 5,
  },
  inputWithCheck: {
    flexDirection: 'row',
    alignItems: 'center',  // Vertically center items
    justifyContent: 'space-between' // added to evenly distribute
},
inputFill: {  // New style to make TextInput fill available space
    flex: 1, 
    marginRight: 0,  // Add some spacing between input and checkmark
},
checkMarkContainer: {
  position: 'absolute',  // Position the checkmark
  right: 10,            // Adjust spacing as needed
  top: '50%',             // Vertically center 
  transform: [{ translateY: -12 }], // Adjust for icon size
  zIndex: 1,          // Ensure it's above other elements
},
breakdownDetailsContainer: {
  flexDirection: 'row', // Align breakdown details in a row
  // marginLeft: Dimensions.get('window').width*0.005,
},
});

//npm install expo-sms