import { useCallback, useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useWebSocket } from './WebSocketContext';
import { useLocation } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const wsUrl = import.meta.env.VITE_SOCKET_URL;

function MobileCameraPage() {
  const query = useQuery();
  const u_id = query.get('u_id');
  const webcamRef = useRef<Webcam>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const { connectWebSocket, disconnectWebSocket, sendMessage, lastResponse } =
    useWebSocket();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  console.log('lastResponse in MobileCameraPage:', lastResponse);

  const startCapturing = useCallback(() => {
    setIsCapturing(true);
    connectWebSocket(wsUrl);
  }, [connectWebSocket]);

  const stopCapturing = useCallback(() => {
    setIsCapturing(false);
    disconnectWebSocket(wsUrl);
  }, [disconnectWebSocket]);

  const captureImage = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      const imageData = imageSrc.split(',')[1];
      const message = {
        u_id,
        type: 'video',
        device: 'mobile',
        payload: imageData,
      };
      sendMessage(wsUrl, message);
      console.log('Image captured and sent:', message);
    }
  }, [u_id, sendMessage]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isCapturing) {
      intervalId = setInterval(captureImage, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isCapturing, captureImage]);

  useEffect(() => {
    console.log('useEffect triggered with lastResponse:', lastResponse);
  }, [lastResponse]);

  const videoConstraints = {
    facingMode: 'environment'
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-xl font-bold mb-6 mt-6 text-center">
        모바일 카메라 세팅을 시작하세요.
      </h1>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        className="w-full h-64 mb-10 p-4 bg-white rounded-xl animate-border-glow"
      />
      <div className="flex space-x-4">
        {!isCapturing ? (
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={startCapturing}
          >
            Start Capturing
          </button>
        ) : (
          <button
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={stopCapturing}
          >
            Stop Capturing
          </button>
        )}
      </div>
      {capturedImage && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold text-center mb-2">
            Captured Image
          </h2>
          <img
            src={capturedImage}
            alt="Captured"
            className="border rounded-lg"
          />
        </div>
      )}
    </div>
  );
}

export default MobileCameraPage;