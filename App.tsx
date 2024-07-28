import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Onboarding from './src/screens/Onboarding.tsx';
import Main from './src/screens/Main.tsx';

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='Onboarding'>
        <Stack.Screen name="Onboarding" component={Onboarding}/>
        <Stack.Screen name="Main" component={Main}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
};


export default App;
