import React, {useEffect, useState, useRef} from 'react';
import {View, Text, Button, Alert, StyleSheet, Platform} from 'react-native';
import {Camera, useCameraDevices} from 'react-native-vision-camera';
import {PERMISSIONS, request, RESULTS} from 'react-native-permissions';

const CameraUse: React.FC = () => {
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const camera = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = devices.back;

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    const result = await request(
      Platform.OS === 'android'
        ? PERMISSIONS.ANDROID.CAMERA
        : PERMISSIONS.IOS.CAMERA,
    );

    if (result === RESULTS.GRANTED) {
      setHasCameraPermission(true);
    } else {
      Alert.alert('권한 필요', '카메라를 사용하려면 권한이 필요합니다.', [
        {text: '확인'},
      ]);
    }
  };

  const takePicture = async () => {
    if (camera.current) {
      try {
        const photo = await camera.current.takePhoto({
          flash: 'off',
          qualityPrioritization: 'balanced',
        });
        console.log(photo.uri);
      } catch (error) {
        console.error(error);
      }
    }
  };

  if (!device) return <Text> 카메라를 키고 있습니다.</Text>;

  if (!hasCameraPermission) {
    return (
      <View style={styles.container}>
        <Text>카메라 권한이 필요합니다.</Text>
        <Button title="권한 요청" onPress={checkCameraPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />
      <View style={styles.captureContainer}>
        <Button title="사진 찍기" onPress={takePicture} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
});

export default CameraUse;
