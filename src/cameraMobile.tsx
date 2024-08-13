import { useEffect, useState, useRef } from 'react';
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
    const u_id = localStorage.getItem('u_id'); // u_id를 WebSocket 초기화 시에 가져오기

    if (!u_id) {
      setErrorMessage('User ID not found. Please login first.');
      return;
    }

    const socket = new WebSocket(import.meta.env.VITE_SOCKET_URL);

    socket.onopen = () => {
      console.log('WebSocket connection opened');
      setErrorMessage('');
      setWs(socket);
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

    // u_id가 설정된 상태에서만 captureFrame 호출
    const captureInterval = setInterval(() => {
      captureFrame(u_id);
    }, 1000);

    return () => clearInterval(captureInterval); // 컴포넌트가 언마운트될 때 인터벌 정리
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

  const captureFrame = async (u_id: string) => {
    if (videoRef.current && ws && ws.readyState === WebSocket.OPEN && u_id) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const frame = canvas.toDataURL('image/jpeg').split(',')[1];
        ws.send(
          JSON.stringify({
            type: 'rtc',
            payload: frame,
            device: 'phone',
            u_id: u_id,
          })
        );
      }
    } else {
      setErrorMessage(
        'WebSocket connection is not open or User ID is missing.'
      );
    }
  };

  return (
    <div>
      <div>
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
            Stop
          </button>
          <button id="resetButton" className="button" onClick={resetStreaming}>
            Reset
          </button>
          {/* Send 버튼은 개별 프레임 전송이 필요할 경우 사용할 수 있음 */}
          {/* <button id="sendButton" className="button" onClick={() => captureFrame(u_id)}> */}
          {/*   Send */}
          {/* </button> */}
        </div>
        <div id="ocr-result">
          <h2>OCR Result:</h2>
          <p>{ocrText}</p>
        </div>
        <div>{errorMessage}</div>
      </div>
      <button onClick={() => navigate('/studygoals')}>학습하기</button>
    </div>
  );
}

export default CameraMobilePage;
