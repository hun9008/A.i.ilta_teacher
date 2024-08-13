// import { useEffect, useState, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';

// function CameraMobilePage() {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const [ws, setWs] = useState<WebSocket | null>(null);
//   const [ocrText, setOcrText] = useState<string>('');
//   const [errorMessage, setErrorMessage] = useState<string>('');
//   const navigate = useNavigate();
//   const localStreamRef = useRef<MediaStream | null>(null);

//   useEffect(() => {
//     const constraints = {
//       video: {
//         facingMode: 'environment',
//       },
//     };

//     navigator.mediaDevices
//       .getUserMedia(constraints)
//       .then((stream) => {
//         if (videoRef.current) {
//           videoRef.current.srcObject = stream;
//           localStreamRef.current = stream;
//         }
//       })
//       .catch((err) => {
//         console.error('Error accessing camera: ', err);
//         setErrorMessage('Error accessing camera. Check console for details.');
//       });

//     return () => {
//       stopStreaming();
//     };
//   }, []);

//   const initWebSocket = () => {
//     const socket = new WebSocket(import.meta.env.VITE_SOCKET_URL);

//     socket.onopen = () => {
//       console.log('WebSocket connection opened');
//       setErrorMessage('');
//     };

//     socket.onmessage = (message) => {
//       const data = JSON.parse(message.data);
//       if (data.type === 'ocr-result' && data.text.trim() !== '') {
//         setOcrText(data.text);
//       }
//     };

//     socket.onerror = (error) => {
//       console.error('WebSocket error:', error);
//       setErrorMessage('WebSocket error occurred. Check console for details.');
//     };

//     socket.onclose = () => {
//       console.log('WebSocket connection closed');
//     };

//     setWs(socket);
//   };

//   const stopStreaming = () => {
//     if (ws) {
//       ws.close();
//       setWs(null);
//     }
//     if (localStreamRef.current) {
//       localStreamRef.current.getTracks().forEach(track => track.stop());
//       localStreamRef.current = null;
//     }
//     if (videoRef.current) {
//       videoRef.current.srcObject = null;
//     }
//     setOcrText('');
//     setErrorMessage('');
//   };

//   const resetStreaming = () => {
//     stopStreaming();
//     initWebSocket();
//   };

//   const captureFrame = async () => {
//     if (videoRef.current && ws && ws.readyState === WebSocket.OPEN) {
//       const canvas = document.createElement('canvas');
//       canvas.width = videoRef.current.videoWidth;
//       canvas.height = videoRef.current.videoHeight;
//       const ctx = canvas.getContext('2d');
//       if (ctx) {
//         ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
//         const frame = canvas.toDataURL('image/jpeg').split(',')[1];
//         ws.send(JSON.stringify({ type: 'video-frame', payload: frame }));
//       }
//     } else {
//       setErrorMessage('WebSocket connection is not open.');
//     }
//   };

//   return (
//     <div>
//       <div>
//         <video ref={videoRef} autoPlay playsInline style={{ width: '300px', height: '300px' }}></video>

//         <div className="button-container">
//           <button id="startButton" className="button" onClick={initWebSocket}>Run</button>
//           <button id="stopButton" className="button" onClick={stopStreaming}>Stop</button>
//           <button id="resetButton" className="button" onClick={resetStreaming}>Reset</button>
//           <button id="sendButton" className="button" onClick={captureFrame}>Send</button>
//         </div>
//         <div id="ocr-result">
//             <h2>OCR Result:</h2>
//             <p>{ocrText}</p>
//         </div>
//         <div>
//           {errorMessage}
//         </div>
//       </div>
//       <button onClick={() => navigate('/studygoals')}>학습하기</button>
//     </div>
//   );
// }

// export default CameraMobilePage;

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function CameraMobilePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const navigate = useNavigate();
  const localStreamRef = useRef<MediaStream | null>(null);
  const streamIntervalRef = useRef<number | null>(null);

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
    const u_id = localStorage.getItem('u_id'); // localStorage에서 u_id 가져오기

    if (!u_id) {
      setErrorMessage('User ID not found. Please login first.');
      return;
    }

    const socket = new WebSocket(import.meta.env.VITE_SOCKET_URL);

    socket.onopen = () => {
      console.log('WebSocket connection opened');
      setErrorMessage('');

      // WebSocket 연결이 열리면 1초에 한 번씩 프레임을 전송
      streamIntervalRef.current = window.setInterval(() => {
        captureFrame(u_id); // u_id를 captureFrame 함수로 전달
      }, 1000); // 1초마다 프레임 전송
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setErrorMessage('WebSocket error occurred. Check console for details.');
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
        streamIntervalRef.current = null;
      }
    };

    setWs(socket);
  };

  const stopStreaming = () => {
    if (ws) {
      ws.close();
      setWs(null);
    }
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setErrorMessage('');
  };

  const resetStreaming = () => {
    stopStreaming();
    initWebSocket();
  };

  const captureFrame = async (u_id: string) => {
    if (videoRef.current && ws && ws.readyState === WebSocket.OPEN) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const frame = canvas.toDataURL('image/jpeg').split(',')[1];

        // 프레임 데이터 전송 시 서버가 기대하는 필드 추가
        ws.send(
          JSON.stringify({
            type: 'rtc',
            payload: frame,
            device: 'mobile', // 'mobile' 디바이스 유형 지정
            u_id: u_id, // localStorage에서 가져온 u_id 사용
          })
        );
      }
    } else {
      setErrorMessage('WebSocket connection is not open.');
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
        </div>
        <div>{errorMessage}</div>
      </div>
      <button onClick={() => navigate('/studygoals')}>학습하기</button>
    </div>
  );
}

export default CameraMobilePage;
