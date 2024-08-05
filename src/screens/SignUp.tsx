import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Button,
  TextInput,
  Alert,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'> & {
  setIsSignedIn: React.Dispatch<React.SetStateAction<boolean>>;
  isSignedIn: boolean;
};

const SignUp: React.FC<Props> = ({navigation, setIsSignedIn, isSignedIn}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordCheck, setPasswordCheck] = useState('');

  const handleSignUp = async () => {
    if (password !== passwordCheck) {
      Alert.alert('Error', '비밀번호가 일치하지 않습니다');
      return;
    }

    try {
      const response = await fetch('http://52.141.30.206:8000/Register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({name, email, password}),
      });
      const result = await response.json();
      // console.log('Response:', result); //로그 찍어보기

      if (response.ok) {
        setIsSignedIn(true);
      } else {
        Alert.alert('Error', result.message || '회원가입 실패');
      }
    } catch (error) {
      Alert.alert('Error', '네트워크 오류');
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      navigation.replace('MainPage');
    }
  }, [isSignedIn, navigation]);

  return (
    <SafeAreaView>
      <View>
        <Text>이름을 입력하세요</Text>
        <TextInput placeholder="Name" value={name} onChangeText={setName} />
        <Text>이메일을 입력하세요</Text>
        <TextInput placeholder="email" value={email} onChangeText={setEmail} />
        <Text>비밀번호를 입력하세요</Text>
        <TextInput
          placeholder="password"
          value={password}
          onChangeText={setPassword}
        />
        <Text>비밀번호를 한번 더 입력하세요</Text>
        <TextInput
          placeholder="password"
          value={passwordCheck}
          onChangeText={setPasswordCheck}
        />

        <Button title="회원 가입하기" onPress={handleSignUp} />
        <Button
          title="이미 계정이 있어요"
          onPress={() => navigation.navigate('SignIn')}
        />
      </View>
    </SafeAreaView>
  );
};

export default SignUp;
