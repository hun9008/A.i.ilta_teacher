import { useEffect, useRef } from 'react';
import LaptopImage from './assets/Laptop.jpg';
import { useWebSocket } from './WebSocketContext';

function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const captureIntervalRef = useRef<number | null>(null);
  const u_id = localStorage.getItem('u_id');
  const cameraSocketUrl = import.meta.env.VITE_SOCKET_URL; // 환경변수에서 가져온 URL 사용

  const { connectWebSocket, sendMessage, isConnected } = useWebSocket();

  useEffect(() => {
    connectWebSocket(cameraSocketUrl);

    return () => {
      stopStreaming();
    };
  }, [connectWebSocket, cameraSocketUrl]);

  const requestCameraAccess = () => {
    const constraints = {
      video: { facingMode: 'user' },
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          localStreamRef.current = stream;
          console.log('Camera stream started:', stream);

          if (isConnected(cameraSocketUrl)) {
            startCapturingFrames();
          }
        }
      })
      .catch((err) => {
        console.error('Error accessing camera:', err);
        alert(
          '카메라 권한이 필요합니다. 브라우저 설정에서 카메라 권한을 허용해주세요.'
        );
      });
  };

  const startCapturingFrames = () => {
    if (captureIntervalRef.current) return;

    console.log('Starting to capture frames...');
    captureIntervalRef.current = window.setInterval(() => {
      captureFrame();
    }, 1000);
  };

  const stopCapturingFrames = () => {
    if (captureIntervalRef.current) {
      console.log('Stopping frame capture...');
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
  };

  const stopStreaming = () => {
    if (localStreamRef.current) {
      console.log('Stopping camera stream...');
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (videoRef.current) {
      console.log('Releasing video element...');
      videoRef.current.srcObject = null;
    }
    stopCapturingFrames();
  };

  const captureFrame = () => {
    console.log('captureFrame called');
    if (!videoRef.current) {
      console.log('Video element not available');
      return;
    }

    if (!isConnected(cameraSocketUrl)) {
      console.log('WebSocket is not connected');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const frame = canvas.toDataURL('image/jpeg').split(',')[1];
      const message = {
        type: 'video',
        payload: frame,
        device: 'pc',
        u_id: u_id,
      };
      sendMessage(cameraSocketUrl, message);
      console.log('captureFrame sent');
    }
  };

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
        <button
          id="startButton"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={requestCameraAccess}
        >
          Run
        </button>
      </div>
    </div>
  );
}

export default CameraPage;
