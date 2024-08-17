import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useWebSocket } from './WebSocketContext';

interface WebcamStreamContextType {
  startStreaming: (wsUrl: string, u_id: string, type: string, device: string) => void;
  stopStreaming: () => void;
  isStreaming: boolean;
  webcamRef: React.RefObject<Webcam>;
}

const WebcamStreamContext = createContext<WebcamStreamContextType | undefined>(undefined);

export const WebcamStreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const { connectWebSocket, disconnectWebSocket, sendMessage } = useWebSocket();
  const streamingInfoRef = useRef<{ wsUrl: string; u_id: string; type: string; device: string } | null>(null);

  const startStreaming = useCallback((wsUrl: string, u_id: string, type: string, device: string) => {
    setIsStreaming(true);
    connectWebSocket(wsUrl);
    streamingInfoRef.current = { wsUrl, u_id, type, device };
  }, [connectWebSocket]);

  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
    if (streamingInfoRef.current) {
      disconnectWebSocket(streamingInfoRef.current.wsUrl);
    }
    streamingInfoRef.current = null;
  }, [disconnectWebSocket]);

  const captureAndSendImage = useCallback(() => {
    if (isStreaming && webcamRef.current && streamingInfoRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        const imageData = imageSrc.split(',')[1];
        const { wsUrl, u_id, type, device } = streamingInfoRef.current;
        const message = { u_id, type, device, payload: imageData };
        sendMessage(wsUrl, message);
      }
    }
  }, [isStreaming, sendMessage]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isStreaming) {
      intervalId = setInterval(captureAndSendImage, 500);
    }
    return () => clearInterval(intervalId);
  }, [isStreaming, captureAndSendImage]);

  return (
    <WebcamStreamContext.Provider value={{ startStreaming, stopStreaming, isStreaming, webcamRef }}>
      {children}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/png"
          videoConstraints={{ facingMode: 'user' }}
        />
      </div>
    </WebcamStreamContext.Provider>
  );
};

export const useWebcamStream = () => {
  const context = useContext(WebcamStreamContext);
  if (!context) {
    throw new Error('useWebcamStream must be used within a WebcamStreamProvider');
  }
  return context;
};