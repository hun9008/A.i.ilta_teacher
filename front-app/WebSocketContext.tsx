import React, { createContext, useContext, useRef, useState } from 'react';

interface WebSocketContextType {
  getSocket: (url: string) => WebSocket | null;
  sendMessage: (url: string, message: any) => void;
  connectWebSocket: (url: string) => void;
  disconnectWebSocket: (url: string) => void;
  isConnected: (url: string) => boolean;
  imageData: string | null;
  ocrResponse: string | null;
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
  const [ocrResponse, setOcrResponse] = useState<string | null>(null);

  const connectWebSocket = (url: string) => {
    if (socketRefs.current[url]) return;
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
      console.log(parsedData.type);
      if (parsedData.type === 'rtc-frame') {
        setImageData(parsedData.payload);
      }
      if (parsedData.type === 'ocr-request') {
        setOcrResponse(parsedData.payload);

        console.log('OCR done', parsedData.payload);
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
    }, 1000);
  };

  const sendMessage = (url: string, message: any): boolean => {
    const socket = socketRefs.current[url];
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
      console.log('Message sent:', message);
      return true; // 메시지 전송 성공
    } else {
      console.error(`WebSocket for ${url} is not connected or ready to send messages`);
      return false; // 메시지 전송 실패
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
        imageData,
        ocrResponse,
      }}
    >
      {children}
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
