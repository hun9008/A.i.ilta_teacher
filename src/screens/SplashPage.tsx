import React, {useState, useEffect} from 'react';
import { SafeAreaView, StyleSheet, Text, View, Image, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'SplashPage'> & { isSignedIn: boolean, isFirstLaunch: boolean };

const SplashPage: React.FC<Props> = ({ navigation, isSignedIn, isFirstLaunch}) => {
  useEffect(() => {
    setTimeout(() => {
      // 다음 화면으로 이동
      // 실제로는 AsyncStorage 등을 사용해 첫 실행 여부를 체크
      // Auth 상태를 체크
      if (isFirstLaunch) {
        navigation.replace('Onboarding');
      } else if (isSignedIn) {
        navigation.replace('MainPage');
      } else {
        navigation.replace('SignIn');
      }
    }, 3000); // 3초 후에 다음 화면으로 이동
  }, [navigation]);

  return (
    <View>
      <Image
        source={require('../../images/jerry.png')}
      />
      <Text>mAI tutor</Text>
      <Text>나만의 튜터</Text>

      <ActivityIndicator
        animating={true}
      />
    </View>
  );
};

export default SplashPage;