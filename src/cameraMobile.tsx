import { useRef, useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './WebSocketContext';
import { useLocation } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const wsUrl = import.meta.env.VITE_SOCKET_URL;

function MobileCameraPage() {
  const query = useQuery();
  const u_id = query.get('u_id');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const { connectWebSocket, disconnectWebSocket, sendMessage } = useWebSocket();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startCapturing = useCallback(async () => {
    setIsCapturing(true);
    connectWebSocket(wsUrl);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 4096 },
          height: { ideal: 2160 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing the camera:', err);
    }
  }, [connectWebSocket]);

  const stopCapturing = useCallback(() => {
    setIsCapturing(false);
    disconnectWebSocket(wsUrl);
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach((track) => track.stop());
  }, [disconnectWebSocket]);

  const captureImage = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageSrc = canvas.toDataURL('image/png', 1.0); // Use maximum quality
        setCapturedImage(imageSrc);
        const imageData = imageSrc.split(',')[1];
        const message = {
          u_id: u_id,
          type: 'video',
          device: 'mobile',
          payload: imageData,
          ocrs: '',
          positions: '',
        };
        sendMessage(wsUrl, message);
      }
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

  return (
    <div className="flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-xl font-bold mb-6 mt-6 text-center">
        모바일 카메라 세팅을 시작하세요.
      </h1>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="border rounded-lg"
      />
      <div className="flex space-x-4 mt-4">
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
