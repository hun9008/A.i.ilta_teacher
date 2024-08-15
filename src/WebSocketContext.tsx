// import React, { createContext, useContext, useRef, useState } from 'react';

// interface WebSocketContextType {
//   socket: WebSocket | null;
//   sendMessage: (message: any) => void;
//   connectWebSocket: () => void;
//   isConnected: boolean;
// }

// const WebSocketContext = createContext<WebSocketContextType | undefined>(
//   undefined
// );

// export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
//   children,
// }) => {
//   const socketRef = useRef<WebSocket | null>(null);
//   const [isConnected, setIsConnected] = useState(false);

//   const connectWebSocket = () => {
//     if (socketRef.current) return; // Prevent re-connecting if already connected

//     const socket = new WebSocket(import.meta.env.VITE_CHAT_SOCKET_URL);
//     socketRef.current = socket;

//     socket.onopen = () => {
//       console.log('WebSocket connection opened');
//       setIsConnected(true);
//     };

//     socket.onclose = (event) => {
//       if (event.wasClean) {
//         console.log(
//           `WebSocket connection closed cleanly, code=${event.code}, reason=${event.reason}`
//         );
//       } else {
//         console.log(
//           `WebSocket connection closed unexpectedly, code=${event.code}`
//         );
//       }
//       setIsConnected(false);
//       socketRef.current = null;
//     };

//     socket.onerror = (error) => {
//       console.error('WebSocket error:', error);
//       setIsConnected(false);
//       socketRef.current = null;
//     };

//     socket.onmessage = (event) => {
//       console.log('Message from server:', event.data);
//     };
//   };

//   const sendMessage = (message: any) => {
//     if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
//       socketRef.current.send(JSON.stringify(message));
//     } else {
//       console.error('WebSocket is not connected or ready to send messages');
//     }
//   };

//   return (
//     <WebSocketContext.Provider
//       value={{
//         socket: socketRef.current,
//         sendMessage,
//         connectWebSocket,
//         isConnected,
//       }}
//     >
//       {children}
//     </WebSocketContext.Provider>
//   );
// };

// export const useWebSocket = () => {
//   const context = useContext(WebSocketContext);
//   if (!context) {
//     throw new Error('useWebSocket must be used within a WebSocketProvider');
//   }
//   return context;
// };

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
} from 'react';

interface WebSocketContextType {
  socket: WebSocket | null;
  sendMessage: (message: any) => void;
  connectWebSocket: () => void;
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
  const [shouldReconnect, setShouldReconnect] = useState(true);
  const reconnectIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = () => {
    if (socketRef.current) return; // Prevent re-connecting if already connected

    const socket = new WebSocket(import.meta.env.VITE_CHAT_SOCKET_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connection opened');
      setIsConnected(true);
      setShouldReconnect(true); // Allow reconnection on future disconnects
    };

    socket.onclose = (event) => {
      console.log(`WebSocket connection closed, code=${event.code}`);
      setIsConnected(false);
      socketRef.current = null;

      if (shouldReconnect && event.code !== 1000) {
        // Reconnect only if the close wasn't clean (code 1000)
        attemptReconnect();
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error observed:', error);
    };

    socket.onmessage = (event) => {
      console.log('Message from server:', event.data);
    };
  };

  const attemptReconnect = () => {
    if (reconnectIntervalRef.current) return; // Already attempting to reconnect

    reconnectIntervalRef.current = setInterval(() => {
      console.log('Attempting to reconnect WebSocket...');
      connectWebSocket();

      if (isConnected) {
        clearInterval(reconnectIntervalRef.current!);
        reconnectIntervalRef.current = null;
      }
    }, 5000); // Try to reconnect every 5 seconds
  };

  const sendMessage = (message: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected or ready to send messages');
    }
  };

  useEffect(() => {
    // Cleanup interval on unmount
    return () => {
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        socket: socketRef.current,
        sendMessage,
        connectWebSocket,
        isConnected,
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
