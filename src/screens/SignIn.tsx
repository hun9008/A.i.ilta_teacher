import React, {useState} from 'react';
import { SafeAreaView, StyleSheet, Text, View, Button, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'> & { setIsSignedIn: (value: boolean) => void };

const SignIn: React.FC<Props> = ({ navigation, setIsSignedIn }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignIn = () => {
        // login request
        setIsSignedIn(true);
        navigation.replace('MainPage');
    }

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