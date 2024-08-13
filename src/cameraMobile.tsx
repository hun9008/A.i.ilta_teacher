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

import { useEffect, useRef } from 'react';

function CameraMobilePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const constraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // WebSocket 연결 설정
          wsRef.current = new WebSocket('wss://backend.maitutor.site/ws');

          wsRef.current.onopen = () => {
            console.log('WebSocket connection opened');
          };

          wsRef.current.onmessage = (event) => {
            console.log('Message from server:', event.data);
          };

          wsRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
          };

          wsRef.current.onclose = () => {
            console.log('WebSocket connection closed');
          };

          // 일정 간격으로 비디오 프레임을 WebSocket을 통해 전송
          streamIntervalRef.current = window.setInterval(() => {
            sendFrame();
          }, 100); // 100ms마다 프레임 전송
        }
      })
      .catch((error) => console.error('Error accessing camera:', error));

    return () => {
      stopStreaming();
    };
  }, []);

  const sendFrame = () => {
    if (!videoRef.current || !canvasRef.current || !wsRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context && videoRef.current) {
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const frameData = canvas.toDataURL('image/jpeg'); // 프레임을 base64 인코딩
      wsRef.current.send(
        JSON.stringify({ type: 'video-frame', payload: frameData })
      );
    }
  };

  const stopStreaming = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  return (
    <div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ display: 'none' }}
      ></video>
      <canvas ref={canvasRef} style={{ width: '300px', height: '300px' }} />
      <div className="button-container">
        <button onClick={() => console.log('Streaming started')}>
          Start Streaming
        </button>
        <button onClick={stopStreaming}>Stop Streaming</button>
      </div>
    </div>
  );
}

export default CameraMobilePage;
