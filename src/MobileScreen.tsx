import { useEffect, useState, useRef } from 'react';
import LaptopImage from './assets/Laptop.jpg';
import { useNavigate } from 'react-router-dom';

function VideoDisplay() {
  const u_id = localStorage.getItem('u_id');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [ocrText, setOcrText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const navigate = useNavigate();
  const intervalRef = useRef<number | null>(null);
  const [imageSrc, setImageSrc] = useState<string>('');
  const localStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!u_id) {
      console.log('no u_id');
      setErrorMessage('u_id is missing from URL.');
      return;
    }

    if (!ws) {
      initWebSocket();
    }

    return () => {
      stopStreaming();
    };
  }, [u_id, ws]);

  const initWebSocket = () => {
    if (ws && ws.readyState !== WebSocket.CLOSED) {
      console.log('WebSocket is already opened or connecting');
      return;
    }

    const socket = new WebSocket(import.meta.env.VITE_SOCKET_URL);

    socket.onopen = () => {
      console.log('WebSocket connection opened');
      setErrorMessage('');
      setWs(socket); // WebSocket 객체 상태 업데이트

      // WebSocket 연결이 열렸을 때 스트리밍 시작
      startStreaming(socket);
    };

    socket.onmessage = (message) => {
      console.log(message.data);
      console.log('Message received:', message);
      const data = JSON.parse(message.data);

      // 모바일에서 보낸 이미지를 수신하여 화면에 표시
      const imgData = `data:image/jpeg;base64,${data.payload}`;
      setImageSrc(imgData); // 이미지 상태 업데이트
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setErrorMessage('WebSocket error occurred. Check console for details.');
    };

    socket.onclose = (event) => {
      console.log('WebSocket connection closed', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });

      // 재연결 시도
      if (event.code !== 1000) {
        console.log('Attempting to reconnect WebSocket...');
        setTimeout(initWebSocket, 1000); // 1초 후 재연결 시도
      }
      setWs(null); // WebSocket 객체를 null로 설정
    };
  };

  const startStreaming = (socket: WebSocket) => {
    console.log('open click start');
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.log('WebSocket connection is not opened');
      setErrorMessage('WebSocket connection is not open.');
      return;
    }

    const sendFrame = (socket: WebSocket) => {
      console.log('open send frame start');
      // if (videoRef.current && socket.readyState === WebSocket.OPEN) {
      console.log('open canvas');
      const canvas = document.createElement('canvas');
      // canvas.width = videoRef.current.videoWidth;
      // canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.log('Failed to get 2D context');
        return;
      }
      // ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const frame = canvas.toDataURL('image/jpeg').split(',')[1];

      const message = {
        type: 'rtc',
        payload: frame,
        device: 'pc',
        u_id: u_id,
      };

      console.log('Sending message:', message);
      socket.send(JSON.stringify(message)); // 프레임 데이터와 함께 PC 정보 전송
      // }
    };

<<<<<<< Updated upstream
    // intervalRef.current = window.setInterval(sendFrame, 1000 / 10000); // 초당 1프레임 전송
    animationFrameRef.current = requestAnimationFrame(() => sendFrame(socket));
=======
    animationFrameRef.current = requestAnimationFrame(() => sendFrame());
>>>>>>> Stashed changes
    console.log('send img');
  };

  const stopStreaming = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (ws) {
      ws.close();
      setWs(null);
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setOcrText('');
    setErrorMessage('');
  };

  const resetStreaming = () => {
    stopStreaming();
    initWebSocket();
  };

  return (
    <div>
      <div>
        <img src={LaptopImage} style={{ width: '100px', height: '100px' }} />

        <div className="button-container">
          <button id="startButton" className="button" onClick={initWebSocket}>
            Start
          </button>
          <button id="stopButton" className="button" onClick={stopStreaming}>
            Stop
          </button>
          <button id="resetButton" className="button" onClick={resetStreaming}>
            Reset
          </button>
        </div>

        <div id="ocr-result">
          <h2>OCR Result:</h2>
          <p>{ocrText}</p>
        </div>
        <div>
          {/* 모바일에서 수신한 이미지 렌더링 */}
          {imageSrc && (
            <img
              src={imageSrc}
              style={{ width: '300px', height: '300px' }}
              alt="Captured Frame"
            />
          )}
          {errorMessage}
        </div>
      </div>
      <button onClick={() => navigate('/StudyGoals')}>학습</button>
    </div>
  );
}

export default VideoDisplay;
