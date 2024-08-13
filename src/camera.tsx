// import { useEffect, useState, useRef } from 'react';
// import LaptopImage from './assets/Laptop.jpg';
// import { useNavigate } from 'react-router-dom';

// function CameraPage() {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const [ws, setWs] = useState<WebSocket | null>(null);
//   // const [ocrText, setOcrText] = useState<string>('');
//   const [errorMessage, setErrorMessage] = useState<string>('');
//   const navigate = useNavigate();
//   const localStreamRef = useRef<MediaStream | null>(null);
//   const captureIntervalRef = useRef<number | null>(null);

//   useEffect(() => {
//     const constraints = {
//       video: {
//         facingMode: 'user',
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
//       setWs(socket); // WebSocket 객체를 setWs로 설정한 후에 캡처를 시작
//       startCapturingFrames(); // WebSocket이 open된 이후에만 캡처를 시작
//     };

//     socket.onerror = (error) => {
//       console.error('WebSocket error:', error);
//       setErrorMessage('WebSocket error occurred. Check console for details.');
//     };

//     socket.onclose = () => {
//       console.log('WebSocket connection closed');
//       stopCapturingFrames();
//     };
//     console.log('WebSocket initialized:', socket); // 로그를 추가하여 WebSocket 객체를 확인
//   };
//   const startCapturingFrames = () => {
//     if (captureIntervalRef.current) return;

//     captureIntervalRef.current = window.setInterval(() => {
//       captureFrame();
//     }, 1000);
//   };

//   const stopCapturingFrames = () => {
//     if (captureIntervalRef.current) {
//       clearInterval(captureIntervalRef.current);
//       captureIntervalRef.current = null;
//     }
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
//     // setOcrText('');
//     setErrorMessage('');
//   };

//   const resetStreaming = () => {
//     stopStreaming();
//     initWebSocket();
//   };

//   const captureFrame = async () => {
//     console.log('captureFrame called');
//     if (!videoRef.current) {
//       console.log('Video element not available');
//     }
//     if (!ws) {
//       console.log('WebSocket is null');
//     } else {
//       console.log('WebSocket readyState:', ws.readyState); // 현재 WebSocket 상태 로그
//     }
//     if (videoRef.current && ws && ws.readyState === WebSocket.OPEN) {
//       const canvas = document.createElement('canvas');
//       canvas.width = videoRef.current.videoWidth;
//       canvas.height = videoRef.current.videoHeight;
//       const ctx = canvas.getContext('2d');
//       if (ctx) {
//         ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
//         const frame = canvas.toDataURL('image/jpeg').split(',')[1];
//         ws.send(JSON.stringify({ type: 'video-frame', payload: frame }));
//         console.log('captureFrame send');
//       }
//     } else {
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
//           {/* <button id="sendButton" className="button" onClick={captureFrame}>
//             Send
//           </button> */}
//         </div>
//         {/* <div id="ocr-result">
//             <h2>OCR Result:</h2>
//             <p>{ocrText}</p>
//         </div> */}
//         <div>{errorMessage}</div>
//       </div>
//       <button onClick={() => navigate('/studygoals')}>학습하기</button>
//     </div>
//   );
// }

// export default CameraPage;
import { useEffect, useState, useRef } from 'react';
import LaptopImage from './assets/Laptop.jpg';
import { useNavigate } from 'react-router-dom';

function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const navigate = useNavigate();
  const localStreamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const constraints = {
      video: {
        facingMode: 'user',
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
      startAutoCapture(); // Start sending frames automatically
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setErrorMessage('WebSocket error occurred. Check console for details.');
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
      stopAutoCapture(); // Stop sending frames when the WebSocket is closed
    };

    setWs(socket);
  };

  const stopStreaming = () => {
    stopAutoCapture(); // Stop sending frames when streaming stops

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
    setErrorMessage('');
  };

  const startAutoCapture = () => {
    if (intervalRef.current) return; // Prevent multiple intervals

    intervalRef.current = setInterval(() => {
      captureFrame();
    }, 1000); // Capture a frame every second
  };

  const stopAutoCapture = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const captureFrame = async () => {
    if (videoRef.current && ws && ws.readyState === WebSocket.OPEN) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const frame = canvas.toDataURL('image/jpeg').split(',')[1];
        ws.send(JSON.stringify({ type: 'video-frame', payload: frame }));
      }
    } else {
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
            Stop
          </button>
        </div>
        <div>{errorMessage}</div>
      </div>
      <button onClick={() => navigate('/StudyGoals')}>학습하기</button>
    </div>
  );
}
export default CameraPage;
