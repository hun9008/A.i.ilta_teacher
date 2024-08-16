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

// WebSocketContext.tsx
import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
} from 'react';

interface WebSocketContextType {
  getSocket: (url: string) => WebSocket | null;
  sendMessage: (url: string, message: any) => void;
  connectWebSocket: (url: string) => void;
  isConnected: (url: string) => boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const socketRefs = useRef<{ [key: string]: WebSocket | null }>({});
  const [connectedStates, setConnectedStates] = useState<{ [key: string]: boolean }>({});

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
        // Reconnect only if the close wasn't clean (code 1000)
        attemptReconnect(url);
      }
    };

    socket.onerror = (error) => {
      console.error(`WebSocket error observed for ${url}:`, error);
    };

    socket.onmessage = (event) => {
      console.log(`Message from server on ${url}:`, event.data);
    };
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
    } else {
      console.error(`WebSocket for ${url} is not connected or ready to send messages`);
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
