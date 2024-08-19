// App.tsx
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MainPage from './MainPage';
import CameraStreamPage from './CameraStreamPage';
import {WebSocketProvider} from './WebSocketContext';

export type RootStackParamList = {
  Main: undefined;
  CameraStream: {qrCode: any};
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  return (
    <WebSocketProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Main">
          <Stack.Screen
            name="Main"
            component={MainPage}
            options={{title: 'Camera'}}
          />
          <Stack.Screen
            name="CameraStream"
            component={CameraStreamPage}
            options={{title: 'Scanned QR Code'}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </WebSocketProvider>
  );
}

export default App;
