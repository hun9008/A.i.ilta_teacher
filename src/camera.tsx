import { useEffect, useRef } from 'react';
import LaptopImage from './assets/Laptop.jpg';

function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const captureIntervalRef = useRef<number | null>(null);
  const u_id = localStorage.getItem('u_id');
  const reconnectAttemptsRef = useRef<number>(0);

  useEffect(() => {
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
        }
      })
      .catch((err) => {
        console.error('Error accessing camera: ', err);
      });

    return () => {
      stopStreaming();
    };
  }, []);

  const initWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('WebSocket is already open');
      return;
    }

    console.log('Initializing WebSocket...');
    wsRef.current = new WebSocket(import.meta.env.VITE_SOCKET_URL);

    wsRef.current.onopen = () => {
      console.log('WebSocket connection opened');
      reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
      startCapturingFrames();
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
    };

    wsRef.current.onclose = (event) => {
      console.log('WebSocket connection closed');
      console.log('Close event:', event);
      stopCapturingFrames();
      if (event.code !== 1000) {
        // 1000 is a normal closure, attempt to reconnect if not
        attemptReconnect();
      }
    };

    console.log('WebSocket initialized:', wsRef.current);
  };

  const attemptReconnect = () => {
    const maxReconnectAttempts = 5;
    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
      reconnectAttemptsRef.current += 1;
      console.log(
        `Attempting to reconnect... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
      );
      setTimeout(initWebSocket, 1000 / 20); // Try to reconnect after 1 second
    } else {
      console.log('Max reconnect attempts reached.');
    }
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
    if (!wsRef.current) {
      console.log('WebSocket is null');
      return;
    }

    if (wsRef.current.readyState !== WebSocket.OPEN) {
      console.log('WebSocket is not open');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const frame = canvas.toDataURL('image/jpeg').split(',')[1];
      const message = JSON.stringify({
        type: 'video',
        payload: frame,
        device: 'pc',
        u_id: u_id,
      });
      wsRef.current.send(message);
      console.log('captureFrame sent');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gray-50 min-h-screen">
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
          onClick={initWebSocket}
        >
          Run
        </button>
      </div>
    </div>
  );
}

export default CameraPage;
