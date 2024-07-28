import React, {useState} from 'react';
import { SafeAreaView, StyleSheet, Text, View, Button, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

const SignUp: React.FC<Props> = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordCheck, setPasswordCheck] = useState('');


    return (
        <SafeAreaView>
        <View>
            <Text>이름을 입력하세요</Text>
            <TextInput
                placeholder="Name"
                value={name}
                onChangeText={setName}
            />
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
            <Text>비밀번호를 한번 더 입력하세요</Text>
            <TextInput
                placeholder="password"
                value={passwordCheck}
                onChangeText={setPasswordCheck}
            />

            <Button title="회원 가입하기" onPress={() => navigation.replace('MainPage')} />
            <Button title="이미 계정이 있어요" onPress={() => navigation.navigate('SignIn')} />
        </View>
        </SafeAreaView>
    );
};


export default SignUp;