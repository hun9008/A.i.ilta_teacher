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

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CameraMobilePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    initCamera();
    initWebSocket();

    return () => {
      stopStreaming();
    };
  }, []);

  const initCamera = () => {
    const constraints = {
      video: { facingMode: 'environment' },
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
        console.error('Error accessing camera:', err);
        setErrorMessage('Error accessing camera. Check console for details.');
      });
  };

  const initWebSocket = () => {
    const ws = new WebSocket(import.meta.env.VITE_SOCKET_URL);
    ws.onopen = () => {
      console.log('WebSocket connection opened');
      setIsStreaming(true);
      startCapturing();
    };

    ws.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === 'ocr-result') {
        console.log('OCR Result:', data.text);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setErrorMessage('WebSocket error occurred. Check console for details.');
      setIsStreaming(false);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setIsStreaming(false);
    };

    wsRef.current = ws;
  };

  const stopStreaming = () => {
    setIsStreaming(false);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
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

  const captureFrame = () => {
    if (
      videoRef.current &&
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN
    ) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const frame = canvas.toDataURL('image/jpeg').split(',')[1];
        wsRef.current.send(
          JSON.stringify({ type: 'video-frame', payload: frame })
        );
      }
    } else {
      setErrorMessage('WebSocket connection is not open.');
    }
  };

  const startCapturing = () => {
    if (isStreaming) {
      captureFrame();
      setTimeout(startCapturing, 1000); // 1초마다 프레임 캡처
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
          <button onClick={initWebSocket} disabled={isStreaming}>
            Start Streaming
          </button>
          <button onClick={stopStreaming} disabled={!isStreaming}>
            Stop Streaming
          </button>
        </div>
        {errorMessage && <div>{errorMessage}</div>}
      </div>
      <button onClick={() => navigate('/StudyGoals')}>Go to Study Goals</button>
    </div>
  );
}

export default CameraMobilePage;
