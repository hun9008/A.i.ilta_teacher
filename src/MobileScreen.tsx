import React, { useEffect } from 'react';
import { useWebSocket } from './WebSocketContext';

const PCControlPage: React.FC = () => {
  const { connectWebSocket, sendMessage, disconnectWebSocket, isConnected } =
    useWebSocket();
  const wsUrl = import.meta.env.VITE_MOBILE_SOCKET_URL; // 모바일 장치의 WebSocket URL

  useEffect(() => {
    // 컴포넌트가 마운트될 때 WebSocket 연결을 설정합니다.
    connectWebSocket(wsUrl);

    return () => {
      // 컴포넌트가 언마운트될 때 WebSocket 연결을 해제합니다.
      disconnectWebSocket(wsUrl);
    };
  }, [connectWebSocket, disconnectWebSocket, wsUrl]);

  const handleSendCommand = () => {
    if (isConnected(wsUrl)) {
      const message = {
        command: 'send_all', // 모바일에서 type: all을 보내도록 명령
      };
      sendMessage(wsUrl, message);
      console.log('Command to send "type:all" sent to mobile.');
    } else {
      console.error('WebSocket is not connected. Cannot send command.');
    }
  };

  return (
    <div>
      <h1>PC Control Panel</h1>
      <button onClick={handleSendCommand}>
        Send Type: All Command to Mobile
      </button>
    </div>
  );
};

export default PCControlPage;
