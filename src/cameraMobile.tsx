import { useEffect, useState, useRef } from 'react';
import LaptopImage from './assets/Laptop.jpg';
import { useNavigate } from 'react-router-dom';

function CameraMobilePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [ocrText, setOcrText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const navigate = useNavigate();
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const constraints = {
      video: {
        facingMode: 'environment',
      },
    };
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          localStreamRef.current = stream;
        }
      })
      .catch((err) => {
        console.error('Error accessing camera: ', err);
        setErrorMessage('Error accessing camera. Check console for details.');
      });

    return () => {
      stopStreaming();
    };
  }, []);

  const initWebSocket = () => {
    const socket = new WebSocket(import.meta.env.VITE_SOCKET_URL);

    socket.onopen = () => {
      console.log('WebSocket connection opened');
      setErrorMessage('');
    };

    socket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      if (data.type === 'ocr-result' && data.text.trim() !== '') {
        setOcrText(data.text);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setErrorMessage('WebSocket error occurred. Check console for details.');
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    setWs(socket);
  };

  const stopStreaming = () => {
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

  const captureFrame = async () => {
    console.log('captureFrame function called'); // 함수 호출 확인 로그

    if (videoRef.current && ws && ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket is open and videoRef is valid'); // 상태 확인 로그

      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const frame = canvas.toDataURL('image/jpeg').split(',')[1];

        // 로컬 스토리지에서 u_id 값 가져오기
        const u_id = localStorage.getItem('u_id');
        if (!u_id) {
          setErrorMessage('u_id is not found in local storage.');
          return;
        }

        // WebSocket을 통해 서버에 프레임 데이터를 전송
        const message = {
          type: 'rtc', // 'ocr' 또는 다른 타입이 올 수 있음
          payload: frame, // 이미지 데이터
          device: 'mobile', // 장치 유형, 예: 'mobile'
          u_id: u_id, // 사용자 ID
        };

        console.log('Sending message:', message); // 추가 로그
        ws.send(JSON.stringify(message));
      }
    } else {
      console.log('WebSocket is not open or videoRef is null'); // 상태 확인 로그
      setErrorMessage('WebSocket connection is not open.');
    }
  };

  return (
    <div>
      <div>
        <img src={LaptopImage} style={{ width: '100px', height: '100px' }} />

        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ width: '300px', height: '300px' }}
        ></video>

        <div className="button-container">
          <button id="startButton" className="button" onClick={initWebSocket}>
            Run
          </button>
          <button id="stopButton" className="button" onClick={stopStreaming}>
            Stopping
          </button>
          <button id="resetButton" className="button" onClick={resetStreaming}>
            Reset1111
          </button>
          <button id="sendButton" className="button" onClick={captureFrame}>
            Send
          </button>
        </div>
        <div id="ocr-result">
          <h2>OCR Result:</h2>
          <p>{ocrText}</p>
        </div>
        <div>
          <video
            ref={videoRef}
            autoPlay
            style={{ width: '300px', height: '300px' }}
          ></video>
          {errorMessage}
        </div>
      </div>
      <button onClick={() => navigate('/StudyGoals')}>학습하기</button>
    </div>
  );
}
export default CameraMobilePage;
