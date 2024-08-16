import { useEffect, useRef, useState } from 'react';
import LaptopImage from './assets/Laptop.jpg';
import { useWebSocket } from './WebSocketContext';

const wsUrl = import.meta.env.VITE_SOCKET_URL;
const u_id = localStorage.getItem('u_id');

function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const { connectWebSocket, disconnectWebSocket, sendMessage } = useWebSocket();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startStreaming = () => {
    const constraints = { video: { facingMode: 'user' } };
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          localStreamRef.current = stream;
          setIsStreaming(true);
          console.log('Camera stream started:', stream);
          connectWebSocket(wsUrl);
        }
      })
      .catch((err) => {
        console.error('Error accessing camera:', err);
        alert('카메라 권한이 필요합니다. 브라우저 설정에서 카메라 권한을 허용해주세요.');
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
    console.log('Camera stream stopped');
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
            const imageData = fullImageData.split(',')[1]; // 메타데이터를 제거하고 인코딩된 데이터만 추출
            setCapturedImage(fullImageData);
            const message = {
              u_id, 
              type: 'video', 
              device: 'pc', 
              payload: imageData
            };
  
            sendMessage(wsUrl, message); // WebSocket으로 전송
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
        집중도를 확인 하기 위해 카메라 세팅이 필요해요.
        <br />
        사진과 같이 카메라를 조정해주세요.
      </h1>
      <div className="flex flex-row items-center justify-center space-x-8">
        <div className="text-center">
          <img
            src={LaptopImage}
            className="w-72 h-72 mb-10 p-4 bg-white rounded-xl animate-border-glow"
            alt="Laptop"
          />
        </div>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-72 h-72 mb-10 p-4 bg-white rounded-xl animate-border-glow"
        ></video>
      </div>
      <div className="flex space-x-4">
        {!isStreaming ? (
          <button
            id="startButton"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={startStreaming}
          >
            Run
          </button>
        ) : (
          <button
            id="stopButton"
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={stopStreaming}
          >
            Stop
          </button>
        )}
      </div>
      {capturedImage && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold text-center mb-2">Captured Image</h2>
          <img src={capturedImage} alt="Captured" className="border rounded-lg" />
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} width={640} height={480} />
    </div>
  );
}

export default CameraPage;
