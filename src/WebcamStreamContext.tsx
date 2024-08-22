import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
} from 'react';
import Webcam from 'react-webcam';
import { useWebSocket } from './WebSocketContext';

interface WebcamStreamContextType {
  startStreaming: (
    wsUrl: string,
    u_id: string,
    type: string,
    device: string,
    position: string,
    ocrs: string
  ) => void;
  stopStreaming: () => void;
  isStreaming: boolean;
}

const WebcamStreamContext = createContext<WebcamStreamContextType | undefined>(
  undefined
);

export const WebcamStreamProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const { connectWebSocket, disconnectWebSocket, sendMessage } = useWebSocket();
  const streamingInfoRef = useRef<{
    wsUrl: string;
    u_id: string;
    type: string;
    device: string;
    position: string;
    ocrs: string;
  } | null>(null);

  const startStreaming = useCallback(
    (
      wsUrl: string,
      u_id: string,
      type: string,
      device: string,
      position: string = '',
      ocrs: string = ''
    ) => {
      setIsStreaming(true);
      connectWebSocket(wsUrl);
      streamingInfoRef.current = { wsUrl, u_id, type, device, position, ocrs };
    },
    [connectWebSocket]
  );

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
        const ocrs = ''; // 변수 선언 및 초기화
        const { wsUrl, u_id, type, device, position } =
          streamingInfoRef.current;
        const message = {
          u_id,
          type,
          device,
          position,
          payload: imageData,
          ocrs,
        }; // 올바른 객체 문법 사용
        sendMessage(wsUrl, message);
        console.log('Sending captured image via WebSocket:', message);
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
    <WebcamStreamContext.Provider
      value={{ startStreaming, stopStreaming, isStreaming }}
    >
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
    throw new Error(
      'useWebcamStream must be used within a WebcamStreamProvider'
    );
  }
  return context;
};
