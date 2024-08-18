import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
} from 'react';
declare var cv: any;

interface WebSocketContextType {
  getSocket: (url: string) => WebSocket | null;
  sendMessage: (url: string, message: any) => void;
  connectWebSocket: (url: string) => void;
  disconnectWebSocket: (url: string) => void;
  isConnected: (url: string) => boolean;
  lastResponse: string | null;
  imageData: string | null;
  // ocrResponse: string | null;
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
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  // const [ocrResponse, setOcrResponse] = useState<string | null>(null);
  const u_id = localStorage.getItem('u_id');

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
        setImageData(parsedData.payload);
      }
      if (parsedData.type === 'response' && parsedData.message === 'Hello!') {
        setLastResponse(parsedData.message);
      }
      if (parsedData.type === 'ocr-request') {
        console.log('OCR done');
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
    }, 1000); // Try to reconnect after 5 seconds
  };

  function handleResponseFromServer(url: string, imageData: string) {
    if (imageData) {
      const message = {
        u_id: u_id,
        type: 'all',
        device: 'mobile',
        payload: imageData, // 이미지를 그대로 전송
      };

      sendMessage(url, message);
      console.log('Original image sent:', message);
    } else {
      console.error('No image data available to process.');
    }
  }

  useEffect(() => {
    console.log('Effect triggered with lastResponse:', lastResponse);

    if (lastResponse === 'Hello!' && imageData) {
      handleResponseFromServer(Object.keys(socketRefs.current)[0], imageData);
      setLastResponse(null); // Reset lastResponse to prevent repeated processing
    }
  }, [lastResponse, imageData]);

  const sendMessage = (url: string, message: any) => {
    const socket = socketRefs.current[url];
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
      console.log('Message sent:', message);
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
        lastResponse,
        imageData,
        // ocrResponse,
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
