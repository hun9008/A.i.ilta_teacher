import React, { createContext, useContext, useRef, useState } from 'react';

interface WebSocketContextType {
  getSocket: (url: string) => WebSocket | null;
  sendMessage: (url: string, message: any) => void;
  connectWebSocket: (url: string) => void;
  disconnectWebSocket: (url: string) => void;
  isConnected: (url: string) => boolean;
  lastResponse: string | null; // 마지막 응답 메시지
  imageData: string | null;
  ocrResponse: string | null; // 마지막 응답 메시지
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const socketRefs = useRef<{ [key: string]: WebSocket | null }>({});
  const [connectedStates, setConnectedStates] = useState<{
    [key: string]: boolean;
  }>({});
  const [imageData, setImageData] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<string | null>(null); // 마지막 응답 상태
  const [ocrResponse, setOcrResponse] = useState<string | null>(null); // 마지막 응답 상태

  const connectWebSocket = (url: string) => {
    if (socketRefs.current[url]) return; // Prevent re-connecting if already connected
    const socket = new WebSocket(url);
    socketRefs.current[url] = socket;

    socket.onopen = () => {
      console.log(`WebSocket connection opened for ${url}`);
      setConnectedStates((prev) => ({ ...prev, [url]: true }));
    };

    socket.onclose = (event) => {
      console.log(`WebSocket connection closed for ${url}, code=${event.code}`);
      setConnectedStates((prev) => ({ ...prev, [url]: false }));
      socketRefs.current[url] = null;
      if (event.code !== 1000) {
        attemptReconnect(url);
      }
    };

    socket.onerror = (error) => {
      console.error(`WebSocket error observed for ${url}:`, error);
    };

    socket.onmessage = (event) => {
      const parsedData = JSON.parse(event.data);
      if (parsedData.type === 'rtc-frame') {
        setImageData(parsedData.payload); // 이미지 데이터를 상태에 저장
      }
      if (parsedData.type === 'response' && parsedData.message === 'Hello!') {
        setLastResponse(parsedData.message); // 서버에서 온 응답을 상태에 저장
        console.log('hi');
      }
      if (parsedData.type === 'ocr-request') {
        setOcrResponse(parsedData.payload);
        console.log('ocr done');
      }
    };
  };

  const disconnectWebSocket = (url: string) => {
    const socket = socketRefs.current[url];
    if (socket) {
      socket.close(1000, 'Disconnect requested by client');
      console.log(`WebSocket disconnection initiated for ${url}`);
    } else {
      console.log(`No active WebSocket connection found for ${url}`);
    }
  };

  const attemptReconnect = (url: string) => {
    setTimeout(() => {
      console.log(`Attempting to reconnect WebSocket for ${url}...`);
      connectWebSocket(url);
    }, 5000); // Try to reconnect after 5 seconds
  };

  const sendMessage = (url: string, message: any) => {
    const socket = socketRefs.current[url];
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
      console.log('메시지 보내짐', message);
    } else {
      console.error(
        `WebSocket for ${url} is not connected or ready to send messages`
      );
    }
  };

  const getSocket = (url: string) => {
    return socketRefs.current[url];
  };

  const isConnected = (url: string) => {
    return connectedStates[url] || false;
  };

  return (
    <WebSocketContext.Provider
      value={{
        getSocket,
        sendMessage,
        connectWebSocket,
        disconnectWebSocket,
        isConnected,
        lastResponse, // lastResponse 상태를 다른 컴포넌트에 제공
        imageData,
        ocrResponse,
      }}
    >
      {children}
      {/*imageData && (
        <div>
          <img
            src={`data:image/png;base64,${imageData}`}
            alt="Received from WebSocket"
          />
        </div>
      )*/}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
