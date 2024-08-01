import { StyleSheet } from 'react-native';
import colors from './colors';

const global = StyleSheet.create({
  text: {
    fontFamily: 'Pretendard',
    color: "#000000",
    fontSize: 30
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.secondary100,
    color: colors.primary500
  },
});

export default global;