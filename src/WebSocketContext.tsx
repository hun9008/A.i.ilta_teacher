import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

interface WebSocketContextType {
  socket: WebSocket | null;
  sendMessage: (message: any) => void;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = new WebSocket(import.meta.env.VITE_CHAT_SOCKET_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connection opened');
      setIsConnected(true);
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    socket.onmessage = (event) => {
      console.log('Message from server:', event.data);
    };

    return () => {
      socket.close();
    };
  }, []);

  const sendMessage = (message: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected or ready to send messages');
    }
  };

  return (
    <WebSocketContext.Provider
      value={{ socket: socketRef.current, sendMessage, isConnected }}
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
