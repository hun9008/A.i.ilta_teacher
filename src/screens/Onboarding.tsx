import React from 'react';
import { SafeAreaView, Text, View, Button } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

import global from "../../styles/global.ts"
import colors from '../../styles/colors.ts';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const Onboarding: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={[global.container]}>
      <View>
        <View>
          <Text style={[global.text]}>나만의</Text>
          <Text style={[global.text]}>중등수학 AI 과외쌤</Text>
          <Text style={[global.text]}>지금 시작해보시오!</Text>
        </View>
        <Button title="회원가입하기" 
          onPress={() => navigation.replace('SignUp')} />
        <Button title="이미 계정이 있어요" onPress={() => navigation.replace('SignIn')} />
      </View>
    </SafeAreaView>
  );
};

export default Onboarding;