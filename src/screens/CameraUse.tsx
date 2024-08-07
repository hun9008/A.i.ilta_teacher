import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  Button,
  Alert,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import {RNCamera} from 'react-native-camera';
import {PERMISSIONS, request, RESULTS} from 'react-native-permissions';

const CameraUse: React.FC = () => {
  const [hasPermission, setHasPermission] = useState<boolean | undefined>(
    undefined,
  );
  const cameraRef = useRef<RNCamera | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const status = await requestCameraPermission();
      setHasPermission(status === RESULTS.GRANTED);
    })();
  }, []);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'ios') {
      return await request(PERMISSIONS.IOS.CAMERA);
    } else {
      return await request(PERMISSIONS.ANDROID.CAMERA);
    }
  };
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const options = {quality: 0.5, base64: true};
        const data = await cameraRef.current.takePictureAsync(options);
        setPhotoData(data.base64);
        console.log(data.base64);
      } catch (error) {
        Alert.alert('안찍힘!');
      }
    }
  };

  if (hasPermission === null) {
    return (
      <View>
        <Text>카메라 권한을 요청 중입니다...</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View>
        <Text>카메라 접근 권한이 없습니다. 설정에서 권한을 허용해주세요.</Text>
      </View>
    );
  }

  return (
    <View style={{flex: 1}}>
      {photoData ? (
        <View style={{flex: 1}}>
          <Image
            source={{uri: `data:image/jpeg;base64,${photoData}`}}
            style={{flex: 1}}
          />
          <TouchableOpacity
            onPress={() => setPhotoData(null)}
            style={styles.capture}>
            <Text style={{fontSize: 14}}> 다시 찍기 </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <RNCamera
          ref={cameraRef}
          style={{flex: 1}}
          type={RNCamera.Constants.Type.back}
          captureAudio={false}>
          <View style={{flex: 1}}>
            <TouchableOpacity onPress={takePicture} style={styles.capture}>
              <Text style={{fontSize: 14}}> SNAP </Text>
            </TouchableOpacity>
          </View>
        </RNCamera>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  capture: {
    flex: 0,
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 15,
    paddingHorizontal: 20,
    alignSelf: 'center',
    margin: 20,
  },
});

export default CameraUse;
