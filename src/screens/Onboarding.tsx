import React from 'react';
import { SafeAreaView, Text, View, Button, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

import global from "../../styles/global.ts"
import colors from '../../styles/colors.ts';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const Onboarding: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={[global.container]}>
      <View style={styles.textView}>
        <Text style={[global.text, styles.text]}>나만의</Text>
        <Text style={[global.text, styles.text]}>중등수학 AI 과외쌤</Text>
        <Text style={[global.text]}>지금 시작해보시오!</Text>
      </View>
      <View style={styles.buttonView}>
        <TouchableOpacity 
          style={[styles.button, styles.signupButton]} 
          onPress={() => navigation.replace('SignUp')}>
          <Text style={styles.signupButtonText}>회원가입하기</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.signinButton]} 
          onPress={() => navigation.replace('SignIn')}>
          <Text style={styles.signinButtonText}>이미 계정이 있어요</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  text: {
    fontWeight: 'bold',
  },
  textView: {
    marginTop: 150, // 텍스트 뷰와 버튼 뷰 사이 간격
  },
  buttonView: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    flex: 1,
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 5,
  },
  signupButton: {
    backgroundColor: colors.primary500,
  },
  signinButton: {
  },
  signupButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  signinButtonText: {
    color: colors.primary600,
    textAlign: 'center',
    fontSize: 16,
  },
});



export default Onboarding;