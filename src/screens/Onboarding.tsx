import React from 'react';
import { View, Text, Button } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const Onboarding: React.FC<Props> = ({navigation}) => {
    return (
        <View>
            <Text>Welcome to onboarding</Text>
            <Button title="Go Main" onPress={() => navigation.navigate('Main')}/>
        </View>
    )
}

export default Onboarding;