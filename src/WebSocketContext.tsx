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
    }, 5000); // Try to reconnect after 5 seconds
  };

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
  function handleResponseFromServer(url: string, imageData: string) {
    if (imageData) {
      const canvas = document.createElement('canvas');
      const img = new Image();
      img.src = `data:image/png;base64,${imageData}`;

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const src = ctx.getImageData(0, 0, canvas.width, canvas.height);

          const processedImageData = preprocessImage(src);

          ctx.putImageData(processedImageData, 0, 0);

          const processedImageDataURL = canvas.toDataURL('image/png');
          const imageDataBase64 = processedImageDataURL.split(',')[1];

          const message = {
            u_id: u_id,
            type: 'all',
            device: 'mobile',
            payload: imageDataBase64,
          };

          sendMessage(url, message);
          console.log('Processed image sent:', message);
        }
      };

      img.onerror = (error) => {
        console.error('Error loading image:', error);
      };
    } else {
      console.error('No image data available to process.');
    }
  }

  function preprocessImage(imageData: ImageData): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get 2D context for preprocessing.');
    }

    ctx.putImageData(imageData, 0, 0);

    const processedImageData = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Contrast adjustment to improve text clarity
    adjustContrast(processedImageData.data, 40);

    // No blur or dilation, directly apply thresholding with adjusted threshold level
    thresholdFilter(processedImageData.data, 0.5); // Adjust threshold level for better text visibility

    return processedImageData;
  }

  function adjustContrast(pixels: Uint8ClampedArray, contrast: number) {
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = clamp(factor * (pixels[i] - 128) + 128);
      pixels[i + 1] = clamp(factor * (pixels[i + 1] - 128) + 128);
      pixels[i + 2] = clamp(factor * (pixels[i + 2] - 128) + 128);
    }
  }

  function clamp(value: number): number {
    return Math.min(255, Math.max(0, value));
  }

  function thresholdFilter(pixels: Uint8ClampedArray, level: number) {
    const threshold = level * 255;
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const value = gray >= threshold ? 255 : 0;
      pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
    }
  }

  useEffect(() => {
    console.log('Effect triggered with lastResponse:', lastResponse);

    if (lastResponse === 'Hello!' && imageData) {
      handleResponseFromServer(Object.keys(socketRefs.current)[0], imageData);
      setLastResponse(null); // Reset lastResponse to prevent repeated processing
    }
  }, [lastResponse, imageData]);

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
