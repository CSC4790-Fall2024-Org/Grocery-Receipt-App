import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Platform, LayoutAnimation,  UIManager, Image  } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign'; // Import AntDesign
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient
import { useNavigation, useRoute } from '@react-navigation/native';
 
// Fixed list of names
const names = ['Satrant', 'Luke', 'Charlie', 'Joey', 'Jaden', 'William', 'Daniel', 'Sara', 'Alex', 'Mike'];
const currency = "$";  // Adding the currency constant
 
const colors = {
  saleColor: 'red',
  yourCostColor: 'green',
  backgroundcolor: '#e1e8f3', //Purple background
  cardColor: '#fbfbfb',  //inside cards
  breakdownColor: '#faf9fb', //bottom breakdown tab
  highlightColor: '#d2edfd',
  taxColor: '#f19508',
  finalTotalColor: '#5289ef',
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
 
const DATA1 = [
  {
    userName: 'Luke',
    phoneNumber: '000-000-0000',
    items: [
      { itemName: 'Garden Salsa Chips', storePrice: '120.00', split: [names[0], names[1]], sale: '100.00' },
      { itemName: 'Nerds Gummy Clusters', storePrice: '3.00', split: [names[2]], sale: '0.50' },
      { itemName: 'Snickerdoodle Cookies', storePrice: '12.00', split: [names[3], names[4]], sale: '0.20' },
      { itemName: 'Peanut Butter Cookies', storePrice: '5.00', split: [names[5]], sale: '0.30' },
      { itemName: 'Reeces Thins', storePrice: '10.00', split: [names[6], names[0], names[0], names[0], names[0]], sale: '1.50' }
    ],
},
{
  userName: 'Charlie',  // New user
  phoneNumber: '000-000-0000',
  items: [
    { itemName: '2% Milk', storePrice: '5.00', split: [names[1], names[2]], sale: '1.00' },
    { itemName: 'Non-Pasturized Milk', storePrice: '4.00', split: [names[3]], sale: '0.75' },
    { itemName: 'Goat Milk', storePrice: '3.00', split: [names[3]], sale: '0.55' },
    { itemName: 'Sheep Milk', storePrice: '2.00', split: [names[3]], sale: '0.25' },
  ],
},
{
  userName: 'Joey',  // New user
  phoneNumber: '000-000-0000',
  items: [
    { itemName: 'Dairy-Free Cheese', storePrice: '8.00', split: [names[1], names[2]], sale: '1.00' },
    { itemName: 'Gluten-Free Bread', storePrice: '4.00', split: [names[3]], sale: '0.75' },
    { itemName: 'DF & GF Bars', storePrice: '18.00', split: [names[3]], sale: '0.55' },
    { itemName: 'White Rice', storePrice: '40.00', split: [names[3]], sale: '0.25' },
  ],
},
{
userName: 'Daniel',  // New user
phoneNumber: '000-000-0000',
  items: [
    { itemName: 'Shredded Cheese', storePrice: '8.00', split: [names[1], names[2]], sale: '1.00' },
    { itemName: '3x Chicken Cutlets', storePrice: '20.00', split: [names[3]], sale: '0.75' },
    { itemName: 'Liquid Egg Whites', storePrice: '18.00', split: [names[3]], sale: '0.55' },
    { itemName: 'Gatorage', storePrice: '14.00', split: [names[3]], sale: '0.25' },
  ],
},
];
 
const TAX = 4.50;
 
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
 
const Row = ({ itemName, storePrice, split, sale, isSelected, userName, toggleSelect, currency }) => {
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
      <View style={styles.leftContainerV2}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
           <TouchableOpacity onPress={() => toggleSelect(itemName, userName)} activeOpacity={1} style={styles.touchableItem}>
            <Text style={[styles.itemText, isSelected && styles.boldText]} numberOfLines={1}>
              <Text style={styles.bulletPoint}>•</Text> {itemName}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      <View style={styles.rightContainerV2}>
      <TouchableOpacity onPress={() => toggleFieldExpansion('yourCost')} style={styles.touchableContainer}>
          <View style={[
            styles.yourCostContainer,
            { height: expandedField === 'yourCost' ? splitHeight :  undefined},  // Apply splitHeight first
            expandedField === 'yourCost' && styles.expandedDataContainer // Apply expansion style if expanded
          ]}>
            <Text style={[styles.yourCostText, isSelected && styles.boldText]}>{currency}{yourCost}</Text>
          </View>
        </TouchableOpacity>
 
        <TouchableOpacity onPress={() => toggleFieldExpansion('split')} style={styles.touchableContainer}>
          <View style={[
            styles.splitContainer,
            { height: expandedField === 'split' ? splitHeight :  undefined},
            expandedField === 'split' && styles.expandedDataContainer
          ]}>
            <Text
              style={[styles.splitText, isSelected && styles.boldText]}
              onLayout={handleSplitLayout}
            >
              {getSplitDisplayNames(split).join(', ')}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => toggleFieldExpansion('sale')}style={styles.touchableContainer}>
          <View style={[
            styles.saleContainer,
            { height: expandedField === 'sale' ? splitHeight :  15 },
            expandedField === 'sale' && styles.expandedDataContainer
          ]}>
            <Text style={[styles.saleText, isSelected && styles.boldText]}>{'-'}{currency}{sale}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => toggleFieldExpansion('storePrice')} style={styles.touchableContainer}>
          <View style={[
            styles.storePriceContainer,
            { height: expandedField === 'storePrice' ? splitHeight :  15 },
            expandedField === 'storePrice' && styles.expandedDataContainer
          ]}>
            <Text style={[styles.storePriceText, isSelected && styles.boldText]}>{currency}{storePrice}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};
 
const BreakdownRow = ({ data, isExpanded, toggleShowMore }) => {
 
  const totalYourCost = data.items.reduce((sum, item) => {
    const itemCost = parseFloat(calculateYourCost(item.storePrice, item.sale, item.split));
    return sum + itemCost;
  }, 0).toFixed(2);
 
return (
  <View style={styles.row}>
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 0,
    }}>
      <View style={styles.buttonContainerInBreakdown}>
      <TouchableOpacity style={[styles.expandButton, { width: 60 }]} onPress={toggleShowMore}>
        <AntDesign name={isExpanded ? 'up' : 'down'} size={15} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.breakdownTotalContainer}>
        <Text style={styles.breakdownTotalText}>Totals:</Text>
      </View>
    </View>
 
    <View style={styles.rightContainer}>
      <View style={styles.breakdownCostContainer}>
        <Text style={styles.breakdownCostText}>
          {currency}{totalYourCost}
        </Text>
      </View>
      <View style={styles.breakdownSaleContainer}>
        <Text style={styles.breakdownSaleText}>
         {'-'}{currency}{getCategoryTotal(data, 'sale')}
        </Text>
      </View>
      <View style={styles.breakdownStoreContainer}>
        <Text style={styles.breakdownStoreText}>
          {currency}{getCategoryTotal(data, 'storePrice')}
        </Text>
      </View>
    </View>
  </View>
  );
};
 
const BottomBar = ({ data, isBottomBarExpanded, toggleBottomBar }) => {
  const numUsers = data.length;
  const totalTax = TAX;
  const taxPerPerson = numUsers > 0 ? (totalTax / numUsers).toFixed(2) : 0;
  const totalsByUser = data.map(user => {
    const userSubtotal = user.items.reduce((sum, item) => {
      return sum + parseFloat(calculateYourCost(item.storePrice, item.sale, item.split));
    }, 0);
 
    const userTax = parseFloat(taxPerPerson); // Use taxPerPerson
    const userTotal = userSubtotal + userTax;
 
    return {
      userName: user.userName,
      subtotal: userSubtotal.toFixed(2),
      total: userTotal.toFixed(2),
    };
  });
 
  const totalSubtotal = totalsByUser.reduce((sum, user) => sum + parseFloat(user.subtotal), 0).toFixed(2);
 
  const totalTotal = totalsByUser.reduce((sum, user) => sum + parseFloat(user.total), 0).toFixed(2);
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
            <View style={styles.emptyHeaderCell} />
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
              <Text style={[styles.allDataText, { color: colors.yourCostColor }]}>{currency}{totalSubtotal}</Text>
              {totalsByUser.map(user => (
                <Text key={user.userName} style={[styles.userDataText, { color: colors.yourCostColor }]}>{currency}{user.subtotal}</Text>
              ))}
            </View>
         
            <View style={styles.dataRow}>
              <View style={styles.categoryLabelCell}>
                <Text style={styles.categoryText}>Tax:</Text>
              </View>
              <Text style={[styles.allDataText, {color: colors.taxColor}]}>{currency}{totalTax.toFixed(2)}</Text>
              {data.map(user => (
                <Text key={user.userName} style={[styles.userDataText, {color: colors.taxColor}]}>{currency}{taxPerPerson}</Text>
              ))}
            </View>
           
            <View style={styles.dataRow}>
              <View style={styles.categoryLabelCell}>
                <Text style={styles.categoryText}>Total:</Text>
              </View>
              <Text style={[styles.allDataText, {color: colors.finalTotalColor, fontWeight: 'bold', fontSize: 16}]}>{currency}{totalTotal}</Text>
              {totalsByUser.map(user => (
                <Text key={user.userName} style={[styles.userDataText, {color: colors.finalTotalColor, fontWeight: 'bold', fontSize: 16}]}>{currency}{user.total}</Text>
              ))}
            </View>
          </View>
        </View>
        </ScrollView>
      )}
    </View>
  );
};
 
const Container = ({ data, selectedItem, toggleSelectItem }) => {
  const [expanded, setExpanded] = useState(false);
 
  // Toggle show more/less
  const toggleShowMore = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); // <-- LayoutAnimation here
    setExpanded(prev => !prev);
  };
 
  return (
   
      <View style={styles.innerContainer}>
        <View style={styles.headerContainer}>
          <View style={styles.userNameContainer}>
            <Text style={styles.userNameText}>{data.userName}</Text>
          </View>
          <View style={styles.yourCostHeaderContainer}>
            <Text style={styles.headerText}>Owed</Text>
          </View>
          <View style={styles.splitHeaderContainer}>
            <Text style={styles.headerText}>Split</Text>
          </View>
          <View style={styles.saleHeaderContainer}>
            <Text style={styles.headerText}>Sale</Text>
          </View>
          <View style={styles.storePriceHeaderContainer}>
            <Text style={styles.headerText}>Retail</Text>
          </View>
        </View>
 
         {/* Display data rows */}
         {data.items.slice(0, expanded ? data.items.length : 3).map((item, index) => (
          <Row
            key={index}
            itemName={item.itemName}
            storePrice={item.storePrice}
            // yourCost={item.yourCost}
            split={item.split}
            sale={item.sale}
            isSelected={selectedItem === item.itemName} // Pass selectedItem state
            toggleSelect={toggleSelectItem} // Pass toggleSelectItem function
          />
        ))}
 
        {/* Horizontal line above BreakdownRow */}
        <View style={styles.horizontalLine} />
 
        {/* Display Breakdown row with calculated values */}
        <BreakdownRow data={data} isExpanded={expanded} toggleShowMore={toggleShowMore} />
      </View>
   
  );
};
 
const NavigationBar = ({ title, navigation}) => {
 
  const handleGoBack = () => {
    //console.log("Go Backward pressed!");
    navigation.goBack();
  };
 
  const handleGoForward = () => {
    //console.log("Go Forward pressed!");
  };
 
  const VenmoLogo = require('../assets/Venmo_Logo.png');
 
  const VenmoLogoComponent = <Image source={VenmoLogo} style={styles.venmoLogo} resizeMode="contain"/>;
 
  return (
    <View style={styles.navigationBar}>
       <View style={styles.leftNavContainer}>
      <TouchableOpacity onPress={handleGoBack} style={styles.navButton}>
        <AntDesign name="left" size={20} color="black" />
      </TouchableOpacity>
      </View>
      <View style={styles.navTitleContainer}>  
      <Text style={[styles.navTitleText, {  position: 'absolute',
        left: Dimensions.get('window').width / 2,  // Calculate horizontal center
        transform: [{ translateX: -Dimensions.get('window').width / 2.47}], //adjust position
        textAlign: 'center'}]}>{title}</Text>
      </View>
      <View style={styles.rightNavContainer}>
         {VenmoLogoComponent}                            
        <TouchableOpacity onPress={handleGoForward} style={styles.navButton}>
          <AntDesign name="right" size={20} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
 
 
// FlatList in the main App
export default function Breakdown() {
  const route = useRoute();
  const initialData = route.params?.updatedData || DATA1; // Get data from route params
  const [data1, setData1] = useState(initialData); // Store in state
  const [selectedItem, setSelectedItem] = useState(null); // Track which row is selected
  const [selectedUserName, setSelectedUserName] = useState(null)
  const [isBottomBarExpanded, setIsBottomBarExpanded] = useState(false);
  const navigation = useNavigation();
  // const [bottomBarHeight, setBottomBarHeight] = useState(0);
  // const bottomBarRef = useRef(null);
 
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
      setSelectedUserName(userName);
    }
  };
 
  return (
    <View style={styles.pageBackground}>
       <NavigationBar title="Your Items" navigation={navigation}/>
      <View style={{ flexGrow: 1}}>
        <FlatList  style={{flex: 1}}
          data={data1} // Use the DATA array
          renderItem={({ item }) => (
            <Container
              data={item}
              selectedItem={selectedItem}
              toggleSelectItem={(itemName) => toggleSelect(itemName, item.userName)}  // Pass userName to toggleSelect
              keyExtractor={(item) => item.userName} // Key by userName
 
            />
          )}
          keyExtractor={(item) => item.userName} // Key by userName
          contentContainerStyle={[
            styles.flatListContent,
           
          ]}
        />
        </View>
        <BottomBar
                  data={data1}
                  isBottomBarExpanded={isBottomBarExpanded}
                  toggleBottomBar={toggleBottomBar}
              />
      </View>
  );
};
 
const styles = StyleSheet.create({
  pageBackground: {
    flex: 1,
    backgroundColor: '#e1e8f3', // Background color
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
    // overflow: 'hidden',
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
  rightContainer: {
    flexDirection: 'row', // Align the data in row format
    justifyContent: 'space-between',
    flex: 1,
    marginLeft: 60,
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
  yourCostContainer: {
    marginLeft: 0,
    width: 50,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  splitContainer: {
    width: 60,
    marginLeft: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saleContainer: {
    width: 54,
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginLeft: -2,
  },
  storePriceContainer: {
    width: 50,
    marginLeft:5,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  yourCostHeaderContainer: {
    width: 70,
    marginLeft: -12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splitHeaderContainer: {
    width: 40,
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saleHeaderContainer: {
    width: 40,
    marginLeft: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storePriceHeaderContainer: {
    width: 40,
    marginLeft: 17,
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
    width: 150,
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
    backgroundColor: '#007BFF',
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
    letterSpacing: 2,
  },
  breakdownCostContainer: {
    marginLeft: -67,
    // flex: 1/.5,
    marginVertical: 7,
    alignItems: 'center', // Align with 'Your Cost' column
  },
  breakdownSaleContainer: {
    // marginLeft: 0,
    // flex: 1/.5,
    marginVertical: 7,
    alignItems: 'center', // Align with 'Sale' column
  },
  breakdownStoreContainer: {
    // marginLeft: 0,
    // flex: 1/.5,
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
});