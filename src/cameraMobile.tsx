// import { useEffect, useState, useRef } from 'react';
// import LaptopImage from './assets/Laptop.jpg';
// import { useNavigate, useLocation } from 'react-router-dom';

// function useQuery() {
//   return new URLSearchParams(useLocation().search);
// }

// function CameraMobilePage() {
//   const query = useQuery();
//   const u_id = query.get('u_id'); // URL 쿼리 매개변수에서 u_id 가져오기
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const [ws, setWs] = useState<WebSocket | null>(null);
//   const [ocrText, setOcrText] = useState<string>('');
//   const [errorMessage, setErrorMessage] = useState<string>('');
//   const navigate = useNavigate();
//   const localStreamRef = useRef<MediaStream | null>(null);

//   useEffect(() => {
//     if (!u_id) {
//       setErrorMessage('u_id is missing from URL.');
//       return;
//     }

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
//   }, [u_id]);

//   const initWebSocket = () => {
//     const socket = new WebSocket(import.meta.env.VITE_SOCKET_URL);

//     socket.onopen = () => {
//       console.log('WebSocket connection opened');
//       setErrorMessage('');
//     };

//     socket.onmessage = (message) => {
//       const data = JSON.parse(message.data);
//       if (data.type === 'ocr-result' && data.ocrs) {
//         setOcrText(data.ocrs);
//       } else if (data.type === 'rtc-frame' && data.payload) {
//         console.log('Received RTC frame:', data.payload);
//         // 여기에서 PC로 프레임 데이터를 처리할 수 있습니다.
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
//       localStreamRef.current.getTracks().forEach((track) => track.stop());
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
//     console.log('captureFrame function called'); // 함수 호출 확인 로그

//     if (videoRef.current && ws && ws.readyState === WebSocket.OPEN) {
//       console.log('WebSocket is open and videoRef is valid'); // 상태 확인 로그

//       const canvas = document.createElement('canvas');
//       canvas.width = videoRef.current.videoWidth;
//       canvas.height = videoRef.current.videoHeight;
//       const ctx = canvas.getContext('2d');
//       if (!ctx) {
//         console.log('Failed to get 2D context'); // 2D 컨텍스트가 유효하지 않은 경우
//         return;
//       }
//       ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
//       const frame = canvas.toDataURL('image/jpeg').split(',')[1];

//       if (!u_id) {
//         console.log('u_id is missing.'); // u_id가 없을 경우 확인 로그
//         setErrorMessage('u_id is missing from URL.');
//         return;
//       }

//       // WebSocket을 통해 서버에 프레임 데이터를 전송
//       const message = {
//         type: 'rtc',
//         payload: frame, // 이미지 데이터
//         device: 'mobile',
//         u_id: u_id, // URL에서 가져온 u_id 사용
//       };

//       console.log('Sending message:', message); // 추가 로그
//       ws.send(JSON.stringify(message));
//     } else {
//       console.log('WebSocket is not open or videoRef is null'); // 상태 확인 로그
//       setErrorMessage('WebSocket connection is not open.');
//     }
//   };

//   return (
//     <div>
//       <div>
//         <img src={LaptopImage} style={{ width: '100px', height: '100px' }} />

//         <video
//           ref={videoRef}
//           autoPlay
//           playsInline
//           style={{ width: '300px', height: '300px' }}
//         ></video>

//         <div className="button-container">
//           <button id="startButton" className="button" onClick={initWebSocket}>
//             Run
//           </button>
//           <button id="stopButton" className="button" onClick={stopStreaming}>
//             Stop
//           </button>
//           <button id="resetButton" className="button" onClick={resetStreaming}>
//             Reset
//           </button>
//           <button id="sendButton" className="button" onClick={captureFrame}>
//             Send
//           </button>
//         </div>
//         <div id="ocr-result">
//           <h2>OCR Result:</h2>
//           <p>{ocrText}</p>
//         </div>
//         <div>
//           <video
//             ref={videoRef}
//             autoPlay
//             style={{ width: '300px', height: '300px' }}
//           ></video>
//           {errorMessage}
//         </div>
//       </div>
//       <button onClick={() => navigate('/StudyGoals')}>학습하기</button>
//     </div>
//   );
// }

// export default CameraMobilePage;

import { useEffect, useState, useRef } from 'react';
import LaptopImage from './assets/Laptop.jpg';
import { useNavigate, useLocation } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function CameraMobilePage() {
  const query = useQuery();
  const u_id = query.get('u_id');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [ocrText, setOcrText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const navigate = useNavigate();
  const localStreamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!u_id) {
      console.log('no u_id');
      setErrorMessage('u_id is missing from URL.');
      return;
    }

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
  }, [u_id]);

  const initWebSocket = () => {
    const socket = new WebSocket(import.meta.env.VITE_SOCKET_URL);

    socket.onopen = () => {
      console.log('WebSocket connection opened');
      setErrorMessage('');
      setWs(socket); // WebSocket 객체 상태 업데이트

      // WebSocket이 열렸을 때만 스트리밍 시작
      startStreaming(socket);
    };

    socket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      if (data.type === 'ocr-result' && data.ocrs) {
        setOcrText(data.ocrs);
      } else if (data.type === 'rtc-frame' && data.payload) {
        console.log('Received RTC frame:', data.payload);
      }
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
        // 1000: Normal Closure
        console.log('Attempting to reconnect WebSocket...');
        setTimeout(initWebSocket, 1000); // 3초 후 재연결 시도
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

    const sendFrame = () => {
      console.log('open send frame start');
      if (videoRef.current && socket.readyState === WebSocket.OPEN) {
        console.log('open canvas');
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.log('Failed to get 2D context');
          return;
        }
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const frame = canvas.toDataURL('image/jpeg').split(',')[1];

        const message = {
          type: 'rtc',
          payload: frame,
          device: 'mobile',
          u_id: u_id,
        };

        console.log('Sending message:', message);
        socket.send(JSON.stringify(message));
      }
    };

    intervalRef.current = window.setInterval(sendFrame, 1000 / 10000);
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

        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ width: '300px', height: '300px' }}
        ></video>

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
          <video
            ref={videoRef}
            autoPlay
            style={{ width: '300px', height: '300px' }}
          ></video>
          {errorMessage}
        </div>
      </div>
      <button onClick={() => navigate('/StudyGoals')}>학습</button>
    </div>
  );
}

export default CameraMobilePage;
