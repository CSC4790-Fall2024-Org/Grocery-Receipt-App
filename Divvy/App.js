import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/home'; // Import your screen components
import DetailsScreen from './screens/lists';
import BreakdownScreen from './screens/breakdown';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Details" component={DetailsScreen} options={{ headerShown: false }} />
        <Stack.Screen name = "Breakdown" component = {BreakdownScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}