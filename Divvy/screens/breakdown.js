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
// {
//   userName: 'Charlie',  // New user
//   phoneNumber: '9048641301',
//   items: [
//     { itemName: '2% Milk', storePrice: '5.00', split: [names[1], names[2]], sale: '1.00' },
//     { itemName: 'Non-Pasturized Milk', storePrice: '4.00', split: [names[3]], sale: '0.75' },
//     { itemName: 'Goat Milk', storePrice: '3.00', split: [names[3]], sale: '0.55' },
//     { itemName: 'Sheep Milk', storePrice: '2.00', split: [names[3]], sale: '0.25' },
//   ],
// },
// {
//   userName: 'Joey',  // New user
//   phoneNumber: '020-000-0000',
//   items: [
//     { itemName: 'Dairy-Free Cheese', storePrice: '8.00', split: [names[1], names[2]], sale: '0.00' },
//     { itemName: 'Gluten-Free Bread', storePrice: '4.00', split: [names[3]], sale: '0.75' },
//     { itemName: 'DF & GF Bars', storePrice: '18.00', split: [names[3]], sale: '0.55' },
//     { itemName: 'White Rice', storePrice: '40.00', split: [names[3]], sale: '0.25' },
//   ],
// },
// {
// userName: 'Daniel',  // New user
// phoneNumber: '2037527960',
//   items: [
//     { itemName: 'Shredded Cheese', storePrice: '8.00', split: [names[1], names[2]], sale: '1.00' },
//     { itemName: '3x Chicken Cutlets', storePrice: '20.00', split: [names[3]], sale: '0.75' },
//     { itemName: 'Liquid Egg Whites', storePrice: '18.00', split: [names[3]], sale: '0.55' },
//     { itemName: 'Gummy Glumper', storePrice: '14.00', split: [names[3]], sale: '0.25' },
//   ],
// },
// ];
 
// const TAX = 4.50;
 
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

const TaxRow = ({ totalSubtotal, userSubtotal, item, proportionalTax, tax, numUsers }) => {  // Receive data, tax, and currency as props

if (!item || !item.items || !Array.isArray(item.items)) {
    console.error("Invalid item data in TaxRow:", item);
    return <Text>Invalid item data for TaxRow</Text>;
  }

  console.log("item data in TaxRow: "+ item);

  // const userSubtotal = item.reduce((sum, i) =>  // item.items is the correct array here
  //   sum + parseFloat(calculateYourCost(i.storePrice, i.sale, i.split)),
  //   0
  // );

// const totalSubtotal = item.items.reduce((sum, user) => { // added check
//   if (!user || !user.items || !Array.isArray(user.items)) { // added check
//       console.error("Invalid user data in TaxRow:", user);
//       return sum; // added check
//   }
//   return sum + user.items.reduce((itemSum, i) =>
//       itemSum + parseFloat(calculateYourCost(i.storePrice, i.sale, i.split)),
//       0),
//   0);
//   };

const userTax = proportionalTax ?
  (userSubtotal / totalSubtotal) * tax :
  (tax / numUsers); 


return (
    <View style={styles.row}>
        <View style={[styles.adjustedWidthContainer, {minWidth: 300, maxWidth: 300}]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text style={[styles.itemText, styles.boldText]} numberOfLines={1}>
                    <Text style={styles.bulletPoint}>•</Text> {proportionalTax ? `Tax (${((userSubtotal / totalSubtotal) * 100).toFixed(2)}%)` : `Tax (${((1/numUsers) * 100).toFixed(0)}%)`}
                </Text>
            </ScrollView>
        </View>
        <View style={styles.rightContainerV2}>
            <View style={[styles.yourTaxContainer, {marginLeft: Dimensions.get('window').width*-.25}]}>
                <Text style={[styles.yourCostText, { color: colors.taxColor }]}>
                   {userTax.toFixed(2)} {/* Display calculated tax with currency */}
                </Text>
            </View>
        </View>
    </View>
);
};
 
const Row = ({ itemName, storePrice, split, sale, isSelected, netPriceIsSelected,  userName, toggleSelect, currency }) => {
  const [expandedField, setExpandedField] = useState(null);
  const [splitHeight, setSplitHeight] = useState(0);

  const handleSplitLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    setSplitHeight(height);
  };

    // Update toggleFieldExpansion to accept userName
    const toggleFieldExpansion = (fieldName) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  
      if (expandedField !== null && expandedField !== fieldName) {
        setExpandedField(null);
      }
  
      setExpandedField(fieldName === expandedField ? null : fieldName);
  
      // Call toggleSelect with userName
      toggleSelect(itemName, userName);  // Pass userName here
    };

  const yourCost = calculateYourCost(storePrice, sale, split);
  const netPrice = calculateNetPrice(storePrice, sale);

  const toggleNetPrice = () => {
    setNetPriceIsSelected(prev => !prev);
  };

  return (
    <View style={styles.row}>
      {isSelected && (
        <LinearGradient
          colors={[colors.fadedHighlightColor, colors.highlightColor, colors.fadedHighlightColor]}
          style={styles.gradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      )}
      <View style={netPriceIsSelected ? styles.leftContainerV2 : styles.adjustedWidthContainer}>
  {netPriceIsSelected ? (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <TouchableOpacity onPress={() => toggleSelect(itemName, userName)} activeOpacity={1} style={styles.touchableItem}>
        <Text style={[styles.itemText, isSelected && styles.boldText]} numberOfLines={1}>
          <Text style={styles.bulletPoint}>•</Text> {itemName}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  ) : (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <TouchableOpacity onPress={() => toggleSelect(itemName, userName)} activeOpacity={1} style={styles.touchableItem}>
        <Text style={[styles.itemText, isSelected && styles.boldText]} numberOfLines={1}>
          <Text style={styles.bulletPoint}>•</Text> {itemName}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )}
</View>
  <View style={styles.rightContainerV2}>
      {netPriceIsSelected ? (
        // Default layout: Net Price, Your Cost, and Split
        <>
         <TouchableOpacity onPress={() => toggleFieldExpansion('storePrice')} style={styles.touchableContainer}>
            <View style={[
              styles.storePriceContainer,
              { height: expandedField === 'storePrice' ? splitHeight : 15 },
              expandedField === 'storePrice' && styles.expandedDataContainer
            ]}>
              <Text style={[styles.storePriceText, isSelected && styles.boldText]}>{currency}{storePrice}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => toggleFieldExpansion('sale')} style={styles.touchableContainer}>
            <View style={[
              styles.saleContainer,
              { height: expandedField === 'sale' ? splitHeight : 15 },
              expandedField === 'sale' && styles.expandedDataContainer
            ]}>
              <Text style={[styles.saleText, isSelected && styles.boldText]}>
                {parseFloat(sale) > 0 ? `-${parseFloat(sale).toFixed(2)}` : `0.00`}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => toggleFieldExpansion('split')} style={styles.touchableContainer}>
            <View style={[
              styles.splitContainer,
              { height: expandedField === 'split' ? splitHeight : undefined },
              expandedField === 'split' && styles.expandedDataContainer
            ]}>
              <Text style={[styles.splitText, isSelected && styles.boldText]} onLayout={handleSplitLayout}>
                {getSplitDisplayNames(split).join(', ')}
              </Text>
            </View>
          </TouchableOpacity>

         <TouchableOpacity onPress={toggleNetPrice} style={styles.touchableContainer}>
            <View style={[
              styles.yourCostContainer,
              { height: expandedField === 'yourCost' ? splitHeight : undefined },
              expandedField === 'yourCost' && styles.expandedDataContainer
            ]}>
              <Text style={[styles.yourCostText, isSelected && styles.boldText]}>{currency}{yourCost}</Text>
            </View>
          </TouchableOpacity>
        </>
      ) : (
        // Alternate layout: Your Cost, Split, Sale, and Retail
        <>
          <TouchableOpacity onPress={toggleNetPrice} style={styles.touchableContainer}>
            <View style={[
              styles.netPriceContainer,
              { height: expandedField === 'netPrice' ? splitHeight : undefined },
              expandedField === 'netPrice' && styles.expandedDataContainer
            ]}>
              <Text style={[styles.netPriceText, isSelected && styles.boldText]}>{currency}{netPrice}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleFieldExpansion('split')} style={styles.touchableContainer}>
            <View style={[
              styles.splitContainerAdjusted,
              { height: expandedField === 'split' ? splitHeight : undefined },
              expandedField === 'split' && styles.expandedDataContainer
            ]}>
              <Text style={[styles.splitText, isSelected && styles.boldText]} onLayout={handleSplitLayout}>
                {getSplitDisplayNames(split).join(', ')}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleFieldExpansion('yourCost')} style={styles.touchableContainer}>
            <View style={[
              styles.yourCostContainerAdjusted,
              { height: expandedField === 'yourCost' ? splitHeight : undefined },
              expandedField === 'yourCost' && styles.expandedDataContainer
            ]}>
              <Text style={[styles.yourCostText, isSelected && styles.boldText]}>{currency}{yourCost}</Text>
            </View>
          </TouchableOpacity>
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

  console.log("data for BreakdownRow:", item);

  const userTax = proportionalTax ?
      (userSubtotal / totalSubtotal) * tax :
      (tax / numUsers);

  const totalYourCost = userSubtotal + userTax;

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
                          <Text style={styles.breakdownTotalText}>Totals:</Text>
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
                      <View style={styles.breakdownTotalContainer}>
                          <Text style={styles.breakdownTotalText}>Total: </Text>
                      </View>
                      <TouchableOpacity onPress={toggleBreakdown} style={styles.touchableTotal} activeOpacity={1}>
                          <Text style={[styles.clickableText, styles.breakdownCostText, {marginLeft: Dimensions.get('window').width*.393, color: colors.finalTotalColorGreen }]}>
                              {currency}{totalYourCost.toFixed(2)}
                          </Text>
                      </TouchableOpacity>
                      {showBreakdown && (
                          <View style={styles.breakdownDetailsContainer}>
                              <View style={[styles.breakdownCostContainerAdjusted, {marginLeft: Dimensions.get('window').width*-0.53, width: Dimensions.get('window').width * 0.15 }]}>
                                  <Text style={styles.breakdownCostText}>
                                      {currency}{userSubtotal.toFixed(2)}
                                  </Text>
                              </View>
                              <View style={[styles.breakdownCostContainerAdjusted, { marginLeft: Dimensions.get('window').width * -0.048, width: Dimensions.get('window').width * 0.15 }]}>
                                  <Text style={[styles.breakdownCostText, { color: colors.arithmeticColor }]}>+</Text>
                              </View>

                              <View style={[styles.breakdownCostContainerAdjusted, { marginLeft: Dimensions.get('window').width * -0.064, width: Dimensions.get('window').width * 0.15 }]}>
                                  <Text style={[styles.breakdownCostText, { color: colors.taxColor }]}>{currency}{userTax.toFixed(2)}</Text>
                              </View>

                              <View style={[styles.breakdownCostContainerAdjusted, { marginLeft: Dimensions.get('window').width * -0.062, width: Dimensions.get('window').width * 0.15 }]}>
                                  <Text style={[styles.breakdownCostText, { color: colors.arithmeticColor }]}>=</Text>
                              </View>
                          </View>
                      )}
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
            <View style={styles.allHeaderCell}><Text style={styles.headerTextBottomBar}>All</Text></View>
            {totalsByUser.map(user => (
              <View key={user.userName} style={styles.userHeaderCell}>
                <Text style={styles.headerText}>{user.userName}</Text>
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
  console.log("item for Container:" + item);
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
    const totalTax = tax;

  // const totalSubtotal = item.items.reduce((sum, i) => // changed to i from item
  //     sum + parseFloat(calculateYourCost(i.storePrice, i.sale, i.split)), 0).toFixed(2);

  const userSubtotal = item.items.reduce((sum, i) =>
      sum + parseFloat(calculateYourCost(i.storePrice, i.sale, i.split)),
      0
  );

  
  // const userTax = (userSubtotal / parseFloat(totalSubtotal)) * totalTax; // is this used?
    // const formattedUserTax = userTax.toFixed(2); // Format to two decimal places


  return (

      <View style={styles.innerContainer}>
        <View style={styles.headerContainer}>
          <View style={styles.userNameContainer}>
            <Text style={styles.userNameText}>{item.userName}</Text>
          </View>
  
          {netPriceIsSelected ? (
            // Default layout: Show Net Price, Split, and Owed
            <>
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
          />
        ))}

        <TaxRow 
        item={item}
        tax={tax} 
        numUsers={numUsers} 
        userSubtotal={userSubtotal}
        totalSubtotal={totalSubtotal}
        proportionalTax={proportionalTax} // Pass the percentage as a string
      />
        {/* Horizontal line above BreakdownRow */}
        <View style={styles.horizontalLine} />

        {/* Display Breakdown row with calculated values */}
        <BreakdownRow numUsers={numUsers} userSubtotal={userSubtotal} totalSubtotal={totalSubtotal} currency={currency} tax={tax} item={item} isExpanded={expanded} toggleShowMore={toggleShowMore} netPriceIsSelected={netPriceIsSelected} proportionalTax={proportionalTax}/>
      </View>
    
  );
};
 
const NavigationBar = ({ totalSubtotal, data, title, modalVisible, selectedOption, closeModal, soloMessageButton, setModalVisible, setSelectedOption, setData1, currency, tax }) => {
  const [dropdownVisible, setDropdownVisible] = React.useState(false);
  const [contactMethod, setContactMethod] = useState(null);
  const [venmoUsernameInput, setVenmoUsernameInput] = useState('');
  const [venmoUsername, setVenmoUsername] = useState(''); // Use state for venmoUsername

  const navigation = useNavigation();
  // const venmoUsername = 'Change-This-Username'; // Your Venmo username

  useEffect(() => {
    if (selectedOption) {
        const selectedUser = data.find(user => user.phoneNumber === selectedOption);
        if (selectedUser) {
            if (contactMethod === 'phone') {
                setVenmoUsername(selectedUser.phoneNumber);
            } else if (contactMethod === 'venmo') {
                setVenmoUsername(venmoUsernameInput); // Use input for Venmo
            }
        }
    } 
    // else if (!selectedOption || selectedOption === 'Self') {
    //     // Reset or set to "Self"
    //     if (contactMethod === 'venmo') {
    //         setVenmoUsername(venmoUsernameInput);
    //     } else {
    //         setVenmoUsername('');
    //     }
    // }

}, [selectedOption, contactMethod, venmoUsernameInput, data]);

  // Function to go back
  const handleGoBack = () => {
    console.log("Go Backward pressed!");
    navigation.goBack();
  };

  // Example of calculateOwedAmount function
  const calculateOwedAmount = (userName, data, tax) => {
    const user = data.find(u => u.userName === userName);
    if (!user) {
        console.error("User not found:", userName);
        return 0;
    }

    // const totalSubtotal = data.reduce((sum, user) =>
    //     sum + user.items.reduce((itemSum, item) =>
    //         itemSum + parseFloat(calculateYourCost(item.storePrice, item.sale, item.split)),
    //         0
    //     ), 0);

    // console.log('Total Subtotal:', totalSubtotal);

    const userSubtotal = user.items.reduce((sum, item) => {
        const cost = parseFloat(calculateYourCost(item.storePrice, item.sale, item.split));
        console.log('Item cost:', item.itemName, cost);
        return sum + cost;
    }, 0);
    
    // Calculate tax proportion
    const userTax = (userSubtotal / totalSubtotal) * tax;
    return (userSubtotal + userTax).toFixed(2);
};

  const createVenmoLink = (amount, note) => {
    return `venmo://paycharge?txn=pay&recipients=${venmoUsername}&amount=${amount}&note=${encodeURIComponent(note)}`;
  };


  const sendIndividualMessage = async (user) => {
    const owedAmount = calculateOwedAmount(user.userName);
    const venmoLink = createVenmoLink(owedAmount, `Grocery Bill for ${user.userName}`);
    const message = `Hey ${user.userName}, you owe $${owedAmount}. Click the link to pay me on Venmo: ${venmoLink}. Thanks for using Divvy!`;

    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
      await SMS.sendSMSAsync([user.phoneNumber], message);
    } else {
      alert('SMS not available. Opening Venmo directly...');
      Linking.openURL(venmoLink);
    }
      setModalVisible(false);
  };

  const sendGroupMessage = async () => {
    let combinedMessage = '';

    for (const user of data) {
      const owedAmount = calculateOwedAmount(user.userName);
      const venmoLink = createVenmoLink(owedAmount, `Grocery Bill for ${user.userName}`);
      combinedMessage += `Hey ${user.userName}, you owe $${owedAmount}. Click the link to pay me on Venmo: ${venmoLink}\n\n`;
    }

    combinedMessage+= `Thanks for using Divvy!`;

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
        <Text style={[styles.navTitleText, { textAlign: 'center' }]}>{title}</Text>
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
                  {selectedOption ? data.find(user => user.phoneNumber === selectedOption)?.userName + ' - ' + data.find(user => user.phoneNumber === selectedOption)?.phoneNumber
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
                        selectedOption === user.phoneNumber && styles.selectedMenuItem,
                      ]}
                      onPress={() => {
                        setSelectedOption(user.phoneNumber);
                        setDropdownVisible(false);
                      }}
                    >
                      {selectedOption === user.phoneNumber ? (
                        <LinearGradient
                          colors={[colors.fadedHighlightColor, colors.highlightColor, colors.fadedHighlightColor]}
                          style={[styles.gradientDropDown, { height: styles.dropdownMenuItem.height }]} // Match menu item height
                          start={{ x: 0.5, y: 0 }}
                          end={{ x: 0.5, y: 1 }}
                        >
                          <Text style={[styles.dropdownMenuItemText, styles.selectedMenuItemText]}>
                            {user.userName}{' - '}{user.phoneNumber}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <Text style={styles.dropdownMenuItemText}>{user.userName}</Text>
                      )}
                    </TouchableOpacity>
                    {index < data.length - 1 && <View style={styles.separator} />}
                  </View>
                ))}
              </View>
              )}
            </View>

            <View style={[styles.modalHorizontalLine, {marginTop: 14, width: '100%'}]}></View>

             {/* New Section: Contact Method Choice */}
             {selectedOption && (
  <View style={{width: '100%'}}>
    <Text numberOfLines={2} ellipsizeMode="tail" style={[styles.modalTitle, {marginTop: 14, width: '100%'}]}>
      Choose{' '}
      {data.find((user) => user.phoneNumber === selectedOption)?.userName}'s
      Preference
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
          (Assume Phone number is associated with{' '}
          {
            data.find((user) => user.phoneNumber === selectedOption)?.userName
          }'s Venmo)
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
          (Enter{' '}
          {
            data.find((user) => user.phoneNumber === selectedOption)?.userName
          }'s Venmo account username instead)
        </Text>
      </TouchableOpacity>
    </View>
    {(contactMethod === 'venmo' &&
      data.find((user) => user.phoneNumber === selectedOption)?.userName ===
        'Self') ? (
      <View style={styles.venmoInputContainer}>
        <Text style={[styles.venmoInputLabel, {fontSize: 12}]}>
          Enter Your Venmo Username Below (To Change It)
        </Text>
        <View style={styles.inputWithCheck}>
        <TextInput
          style={[styles.venmoInput, styles.inputFill]}
          placeholder="Venmo Username"
          value={venmoUsernameInput}
          onChangeText={(text) => {
            setVenmoUsernameInput(text);
            setVenmoUsername(text);
          }}
          placeholderTextColor="gray"
        />
        <TouchableOpacity
          style={styles.checkMarkContainer}
          onPress={() => {
            Keyboard.dismiss();
        
            const selectedUser = data.find(
              (user) => user.phoneNumber === selectedOption || user.userName === 'Self'
            );
        
            if (selectedUser) {
              let updatedData;
        
              if (selectedUser.userName === 'Self') {
                // Always update 'Self' with venmoUsernameInput
                updatedData = data.map((user) =>
                  user.userName === 'Self'
                    ? { ...user, phoneNumber: venmoUsernameInput }
                    : user
                );
                setSelectedOption(venmoUsernameInput); // Update selectedOption to trigger useEffect
              } else {
                if (contactMethod === 'phone') {
                  // Update phoneNumber in DATA1 if contactMethod is phone
                  updatedData = data.map((user) =>
                    user.phoneNumber === selectedOption
                      ? { ...user, phoneNumber: venmoUsernameInput }
                      : user
                  );
                  setSelectedOption(venmoUsernameInput); // Update selectedOption to trigger useEffect
                } else {
                  // No updates to DATA1; just update venmoUsername with the input
                  setSelectedOption(selectedOption); // Updates venmoUsername to match venmoUsernameInput
                }
              }
        
              if (updatedData) {
                // Update the state with the new DATA1
                setData1(updatedData);
              // Clear the venmoUsernameInput field after saving
               setVenmoUsernameInput('');
              }
             
            }
          }}
        >
          <AntDesign name="checksquareo" size={24} color="green" />
        </TouchableOpacity>
        </View>
      </View>
    ) : contactMethod === 'venmo' ? (
      <View style={styles.venmoInputContainer}>
        <Text style={styles.venmoInputLabel}>
          Enter{' '}
          {
            data.find((user) => user.phoneNumber === selectedOption)?.userName
          }'s Venmo Username Below
        </Text>
        <View style={styles.inputWithCheck}> 
        <TextInput
            style={[styles.venmoInput, styles.inputFill]}
            placeholder="Venmo Username"
            value={venmoUsernameInput}
            onChangeText={(text) => {
              setVenmoUsernameInput(text);
              setVenmoUsername(text);
            }}
            placeholderTextColor="gray"
          />
          <TouchableOpacity
          style={styles.checkMarkContainer}
          onPress={() => {
            Keyboard.dismiss();
        
            const selectedUser = data.find(
              (user) => user.phoneNumber === selectedOption || user.userName === selectedOption
            );
        
            if (selectedUser) {
              let updatedData;
        
                if (contactMethod === 'venmo') {
                  // Update phoneNumber in DATA1 if contactMethod is phone
                  updatedData = data.map((user) =>
                    user.phoneNumber === selectedOption
                      ? { ...user, phoneNumber: venmoUsernameInput }
                      : user
                  );
                  setSelectedOption(venmoUsernameInput); // Update selectedOption to trigger useEffect
                } else {
                  // No updates to DATA1; just update venmoUsername with the input
                  setSelectedOption(selectedOption); // Updates venmoUsername to match venmoUsernameInput
                }
              
        
              if (updatedData) {
                // Update the state with the new DATA1
                setData1(updatedData);
              // Clear the venmoUsernameInput field after saving
               setVenmoUsernameInput('');
              }
            }
             
            }}
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
                status={selectedOption === 'groupChat' ? 'checked' : 'unchecked'}
                onPress={() => {
                  setSelectedOption('groupChat');
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
                setSelectedOption(`individual-${user.userName}`);
                sendIndividualMessage(user);
              }}
            >
              <RadioButton
                value={`individual-${user.userName}`}
                status={selectedOption === `individual-${user.userName}` ? 'checked' : 'unchecked'}
                // onPress={() => {}}  // Remove the onPress here since it's handled by the parent TouchableOpacity
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
  const initialData = route.params?.updatedData; // Get data from route params removed []
  console.log("initialData:" + initialData);
  const [data1, setData1] = useState(initialData); // Store in state
  const [tax, setTax] = useState(tax);
  const [selectedItem, setSelectedItem] = useState(null); // Track which row is selected
  const [selectedUserName, setSelectedUserName] = useState(null)
  const [isBottomBarExpanded, setIsBottomBarExpanded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null); // Track the selected radio button
  const [proportionalTax, setProportionalTax] = useState(false); // Add this state
  const navigation = useNavigation();

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
    paddingVertical: 5,
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
    width: Dimensions.get('window').width-25,
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
    maxWidth: 136,
    minWidth: 136,
    marginLeft: 4,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  adjustedWidthContainer: {
    flex: 1,
    paddingRight: 0,
    minWidth: 195,
    maxWidth: 195,
    marginLeft: 4,
    paddingHorizontal: 2,
    paddingVertical: 2,
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
    marginLeft: 4,
  },
  expandedDataContainer: {
    maxWidth: '100%', // Expand to fit content when expanded
    height: undefined,// Remove fixed height when expanded
    paddingHorizontal: 2, // Consistent padding
  },
  // Individual containers for each field in the right container
  netPriceContainer: {
    marginLeft: Dimensions.get('window').width*0.012,
    // width: 50,
    width: Dimensions.get('window').width*.11,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  yourCostContainer: {
    marginLeft: 0,
    // width: 50,
    width: Dimensions.get('window').width*.11,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  yourTaxContainer: {
    marginLeft: 0,
    // width: 50,
    width: Dimensions.get('window').width*.383,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  yourCostContainerAdjusted: {
    marginLeft: Dimensions.get('window').width*-0.005,
    // width: 50,
    width: Dimensions.get('window').width*.11,
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
    marginLeft: Dimensions.get('window').width*-0.033,
    justifyContent: 'center',
    alignItems: 'center',
  },
  netPriceHeaderContainer: {
    width: Dimensions.get('window').width*.16,
    // marginLeft: 4,
    marginLeft: Dimensions.get('window').width*.045,
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
    width: 180,
    justifyContent: 'center',
    paddingLeft: 10,
  },
  userNameText: {
    fontSize: 23,
    fontWeight: 'bold',
    textAlign: 'left',
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
    marginLeft: 0,
    marginVertical: 3,
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
    fontSize: 17,
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
    minWidth: 64,
    maxWidth: 64,
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
    justifyContent: 'space-between',
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
  navTitleContainer: {                // Styles for title container
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',                       // Allows title to take available space
    alignItems: 'center',           // Centers title horizontally
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
    alignItems: 'center',
    flexDirection: 'row',
    width: 100,
  },
  rightNavContainer:{
    flexDirection: 'row',  // Align image and button horizontally
    alignItems: 'center',   // Center vertically
    width: 100,
  },
  proportionalTaxButton: {
    backgroundColor: 'grey',
    borderRadius: 5,
    padding: 5,
    minWidth: 5,
    maxWidth: 87,
    marginRight: 10,  // Add some margin
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
  marginLeft: Dimensions.get('window').width*0.005,
},
});

//npm install expo-sms