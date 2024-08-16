import { useEffect, useRef, useState } from 'react';
import { useWebSocket } from './WebSocketContext';
import { useLocation } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const wsUrl = import.meta.env.VITE_SOCKET_URL;
// const u_id = localStorage.getItem('u_id');

function MobileCameraPage() {
  const query = useQuery();
  const u_id = query.get('u_id');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const { connectWebSocket, disconnectWebSocket, sendMessage } = useWebSocket();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startStreaming = () => {
    const constraints = { video: { facingMode: 'environment' } };
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          localStreamRef.current = stream;
          setIsStreaming(true);
          console.log('Mobile camera stream started:', stream);
          connectWebSocket(wsUrl);
        }
      })
      .catch((err) => {
        console.error('Error accessing mobile camera:', err);
        alert(
          '카메라 권한이 필요합니다. 브라우저 설정에서 카메라 권한을 허용해주세요.'
        );
      });
  };

  const stopStreaming = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    console.log('Mobile camera stream stopped');
    disconnectWebSocket(wsUrl);
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isStreaming) {
      intervalId = setInterval(() => {
        if (canvasRef.current && videoRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const fullImageData = canvas.toDataURL('image/png');
            const imageData = fullImageData.split(',')[1];
            setCapturedImage(fullImageData);
            const message = {
              u_id,
              type: 'video',
              device: 'mobile',
              payload: imageData,
            };

            sendMessage(wsUrl, message); // WebSocket으로 전송
            console.log('Image captured and sent:', message);
          }
        }
      }, 2000); // 2초마다 캡처
    }
    return () => clearInterval(intervalId);
  }, [isStreaming]);

  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-xl font-bold mb-6 mt-6 text-center">
        모바일 카메라 세팅을 시작하세요.
      </h1>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-64 mb-10 p-4 bg-white rounded-xl animate-border-glow"
      ></video>
      <div className="flex space-x-4">
        {!isStreaming ? (
          <button
            id="startButton"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={startStreaming}
          >
            Start Camera
          </button>
        ) : (
          <>
            {/* <button
              id="captureButton"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={captureAndSendImage}
            >
              Capture & Send
            </button> */}
            <button
              id="stopButton"
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={stopStreaming}
            >
              Stop Camera
            </button>
          </>
        )}
      </div>
      {capturedImage && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold text-center mb-2">
            Captured Image11
          </h2>
          <img
            src={capturedImage}
            alt="Captured"
            className="border rounded-lg"
          />
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
        width={640}
        height={480}
      />
    </div>
  );
}

export default MobileCameraPage;
