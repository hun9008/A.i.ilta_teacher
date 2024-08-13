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
        const data = JSON.parse(message.data);
        if (data.type === 'rtc-frame' && data.payload) {
          // 서버에서 받은 이미지 데이터를 화면에 표시
          const imgData = `data:image/jpeg;base64,${data.payload}`;
          setImageSrc(imgData);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error on PC:', error);
      };

      socket.onclose = () => {
        console.log('WebSocket connection closed on PC');
      };

      setWs(socket);
    };

    initWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  return (
    <div>
      <h1>PC Dashboard</h1>
      {imageSrc ? (
        <img
          src={imageSrc}
          alt="Captured from mobile"
          style={{ width: '500px', height: 'auto' }}
        />
      ) : (
        <p>No image received from mobile yet.</p>
      )}
    </div>
  );
};

export default VideoDisplay;
