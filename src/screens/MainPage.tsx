import React from 'react';
import { Button, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'MainPage'>

const MainPage: React.FC<Props> = ({navigation}) => {
  return (
    <SafeAreaView>
      <View>
        <Text>메인페이지요</Text>
        <Button title="카메라" onPress={() => navigation.replace('CameraUse')} />
        </View>
    </SafeAreaView>
  );
};

export default MainPage;