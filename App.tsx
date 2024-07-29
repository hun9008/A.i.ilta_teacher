import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; //각 os 기본의 native stack
//import SplashScreen from 'react-native-splash-screen';

import Onboarding from './src/screens/Onboarding.tsx';
import SignIn from './src/screens/SignIn.tsx';
import SignUp from './src/screens/SignUp.tsx';
import MainPage from './src/screens/MainPage.tsx';

//타입스크립트에선 각 stack파라미터의 형식 지정해줘야함. 그래서 각 페이지별로 undefined 선언
export type RootStackParamList = {
  Onboarding: undefined;
  SignIn: undefined;
  SignUp: undefined;
  MainPage: undefined;
};
const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isFirstLaunch ? 'Onboarding' : isSignedIn ? 'MainPage' : 'SignIn'}>
        {isFirstLaunch && (
          <Stack.Screen name="Onboarding" component={Onboarding} options={{ headerShown: false }} />
        )}
        <Stack.Screen name="SignIn">
          {(props) => <SignIn {...props} setIsSignedIn={setIsSignedIn} />}
        </Stack.Screen>
        <Stack.Screen name="SignUp" component={SignUp} options={{ headerShown: true }} />
        {isSignedIn && (
          <Stack.Screen name="MainPage" component={MainPage} options={{ headerShown: true }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};


export default App;
