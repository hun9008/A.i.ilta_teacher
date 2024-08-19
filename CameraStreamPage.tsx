// CameraStreamPage.tsx
import React, {useState, useEffect, useRef} from 'react';
import {SafeAreaView, Text, StyleSheet, View, Image} from 'react-native';
import {RouteProp, useRoute} from '@react-navigation/native';
import {useCameraDevice, Camera} from 'react-native-vision-camera';
import {useWebSocket} from './WebSocketContext';
import {readFile} from 'react-native-fs';

type CameraStreamPageRouteProp = RouteProp<{params: {qrCode: string}}, 'params'>;

function CameraStreamPage(): React.JSX.Element {
  const route = useRoute<CameraStreamPageRouteProp>();
  const {qrCode} = route.params;

  const [uId, setUId] = useState<string | null>(null);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [lastMessageStatus, setLastMessageStatus] = useState<string | null>(null);

  const camera = useRef<Camera>(null);
  const {connectWebSocket, sendMessage, isConnected} = useWebSocket();

  const webSocketUrl = 'wss://backend.maitutor.site/ws';

  useEffect(() => {
    const match = qrCode.match(/[?&]u_id=([^&]+)/);
    if (match) {
      setUId(decodeURIComponent(match[1]));
    }
  }, [qrCode]);

  useEffect(() => {
    if (uId) {
      connectWebSocket(`${webSocketUrl}?u_id=${uId}`);
    }
  }, [uId, connectWebSocket]);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (camera.current && uId && isConnected(`${webSocketUrl}?u_id=${uId}`)) {
        try {
          const snapshot = await camera.current.takeSnapshot({
            quality: 100
          });
          setCapturedImageUri(snapshot.path);

          // 이미지 파일을 Base64로 인코딩
          const base64data = await readFile(snapshot.path, 'base64');

          // 웹소켓 메시지 생성
          const message = {
            u_id: uId,
            type: 'video',
            device: 'mobile',
            payload: base64data,
          };

          // 메시지 전송
          const success = sendMessage(`${webSocketUrl}?u_id=${uId}`, message);
          if (success) {
            setLastMessageStatus('성공!');
          } else {
            setLastMessageStatus('Failed to send message');
          }
        } catch (error) {
          console.error('Failed to capture or send image', error);
          setLastMessageStatus('Failed to capture or send image');
        }
      }
    }, 1000); // 1초에 한 번씩 캡처 및 전송

    return () => clearInterval(intervalId); // 컴포넌트 언마운트 시 인터벌 제거
  }, [uId, camera, isConnected, sendMessage]);

  const device = useCameraDevice('back');
  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <View>
          <Text>No camera device found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo
      />
      <View style={styles.overlay}>
        <Text style={styles.text}>Scanned QR Code URL:</Text>
        <Text style={styles.qrCode}>{qrCode}</Text>
        {uId && (
          <>
            <Text style={styles.text}>Extracted u_id:</Text>
            <Text style={styles.uId}>{uId}</Text>
            <Text style={styles.text}>WebSocket Status: {isConnected(`${webSocketUrl}?u_id=${uId}`) ? 'Connected' : 'Disconnected'}</Text>
            <Text style={styles.text}>Message Status: {lastMessageStatus}</Text>
          </>
        )}
        {capturedImageUri && (
          <Image
            source={{uri: `file://${capturedImageUri}`}}
            style={styles.capturedImage}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 10,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  qrCode: {
    fontSize: 10,
    color: 'white',
    marginBottom: 5,
  },
  uId: {
    fontSize: 16,
    color: 'lightgreen',
  },
  capturedImage: {
    marginTop: 20,
    width: 175,
    height: 250,
    borderRadius: 10,
    opacity: 0.7,
    alignSelf: 'center',
  },
});

export default CameraStreamPage;
