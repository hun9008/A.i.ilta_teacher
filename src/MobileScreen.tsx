import React, { useEffect, useState } from 'react';

const VideoDisplay: React.FC = () => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [imageSrc, setImageSrc] = useState<string>('');

  useEffect(() => {
    const initWebSocket = () => {
      const socket = new WebSocket(import.meta.env.VITE_SOCKET_URL);

      socket.onopen = () => {
        console.log('WebSocket connection opened on PC');
      };

      socket.onmessage = (message) => {
        console.log('Message received:', message);
        const data = JSON.parse(message.data);
        if (data.type === 'rtc-frame' && data.payload) {
          const imgData = `data:image/jpeg;base64,${data.payload}`;
          setImageSrc(imgData); // 새로운 프레임을 수신하면 이미지 업데이트
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
      };

      setWs(socket);
    };

    initWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [ws]);

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
