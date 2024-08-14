import React, { useEffect, useState } from 'react';

const VideoDisplay: React.FC = () => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [imageSrc, setImageSrc] = useState<string>('');

  const initWebSocket = () => {
    console.log('Initializing WebSocket...');
    try {
      const socket = new WebSocket(import.meta.env.VITE_SOCKET_URL);

      socket.onopen = () => {
        console.log('WebSocket connection opened on PC');
      };

      socket.onmessage = (message) => {
        console.log('Message received:', message);
        const data = JSON.parse(message.data);
        if (data.type === 'rtc-frame' && data.payload) {
          const imgData = `data:image/jpeg;base64,${data.payload}`;
          setImageSrc(imgData);
        } else {
          console.log('Received message but not rtc-frame:', data);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error on PC:', error);
      };

      socket.onclose = (event) => {
        console.log('WebSocket connection closed on PC', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });

        // WebSocket 재연결 시도
        if (event.code !== 1000) {
          // 1000: Normal Closure
          console.log('Reconnecting WebSocket...');
          setTimeout(initWebSocket, 3000); // 3초 후 재연결 시도
        }
      };

      setWs(socket);
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  };

  useEffect(() => {
    // WebSocket 연결을 설정
    initWebSocket();

    return () => {
      // 컴포넌트가 unmount될 때 WebSocket 연결을 닫음
      if (ws && ws.readyState === WebSocket.OPEN) {
        console.log('Closing WebSocket connection');
        ws.close();
      }
    };
  }, []); // 빈 배열을 넣어 이 효과가 컴포넌트 마운트 시 한 번만 실행되도록 함

  return (
    <div>
      <h1>PC Dashboard</h1>
      {imageSrc ? (
        <img
          src={imageSrc}
          alt="Live from mobile"
          style={{ width: '500px', height: 'auto' }}
        />
      ) : (
        <p>No image received from mobile yet.</p>
      )}
    </div>
  );
};

export default VideoDisplay;
