import React, {useEffect, useState, useRef} from 'react';
import {View, Text, Button, Alert, StyleSheet, Platform} from 'react-native';
import { RNCamera } from 'react-native-camera';
import {PERMISSIONS, request, RESULTS} from 'react-native-permissions';

const CameraUse: React.FC = () => {
  const [hasPermission, setHasPermission] = useState<boolean | undefined>(undefined);

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

  if (hasPermission === null) {
    return <View><Text>카메라 권한을 요청 중입니다...</Text></View>;
  }
  if (hasPermission === false) {
    return <View><Text>카메라 접근 권한이 없습니다. 설정에서 권한을 허용해주세요.</Text></View>;
  }

  return (
    <View style={{ flex: 1 }}>
      <RNCamera
        style={{ flex: 1 }}
        type={RNCamera.Constants.Type.back}
        captureAudio={false}
      />
    </View>
  );
};

export default CameraUse;