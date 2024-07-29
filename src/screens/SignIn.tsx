import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View, Button, TextInput, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'> & { setIsSignedIn: (value: boolean) => void , isSignedIn: boolean};

const SignIn: React.FC<Props> = ({ navigation, setIsSignedIn, isSignedIn }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignIn = async () => {
        /*
        try {
            const response = await fetch('https://example.com/api/signin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
            });
            const result = await response.json();
    
            if (response.ok) {
            setIsSignedIn(true);
            } else {
            Alert.alert('Error', result.message || '로그인 실패');
            }
        } catch (error) {
            Alert.alert('Error', '네트워크 오류');
        }*/
        setIsSignedIn(true); //백엔드 연결되면 지워야함
    }

    useEffect(() => {
        if (isSignedIn) {
          navigation.replace('MainPage');
        }
      }, [isSignedIn, navigation]);

    return (
        <SafeAreaView>
        <View>
            <Text>이메일을 입력하세요</Text>
            <TextInput
                placeholder="email"
                value={email}
                onChangeText={setEmail}
            />
            <Text>비밀번호를 입력하세요</Text>
            <TextInput
                placeholder="password"
                value={password}
                onChangeText={setPassword}
            />

            <Button title="로그인 하기" onPress={handleSignIn} />
            <Button title="비밀번호 찾기" />
        </View>
        </SafeAreaView>
    );
};


export default SignIn;