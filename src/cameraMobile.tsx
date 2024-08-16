// import { useEffect, useState, useRef } from 'react';
// import { useLocation } from 'react-router-dom';

// function useQuery() {
//   return new URLSearchParams(useLocation().search);
// }

// function CameraMobilePage() {
//   const query = useQuery();
//   const u_id = query.get('u_id');
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const [ws, setWs] = useState<WebSocket | null>(null);

//   const localStreamRef = useRef<MediaStream | null>(null);
//   const intervalRef = useRef<number | null>(null);

//   useEffect(() => {
//     if (!u_id) {
//       console.log('no u_id');
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
//       });

//     return () => {
//       stopStreaming();
//     };
//   }, [u_id]);

//   const initWebSocket = () => {
//     const socket = new WebSocket(import.meta.env.VITE_SOCKET_URL);

//     socket.onopen = () => {
//       console.log('WebSocket connection opened');
//       setWs(socket); // WebSocket 객체 상태 업데이트

//       // WebSocket이 열렸을 때만 스트리밍 시작
//       startStreaming(socket);
//     };

//     socket.onmessage = (message) => {
//       const data = JSON.parse(message.data);
//       if (data.type === 'rtc-frame' && data.payload) {
//         console.log('Received RTC frame:', data.payload);
//       }
//     };

//     socket.onerror = (error) => {
//       console.error('WebSocket error:', error);
//     };

//     socket.onclose = (event) => {
//       console.log('WebSocket connection closed', {
//         code: event.code,
//         reason: event.reason,
//         wasClean: event.wasClean,
//       });

//       // 재연결 시도
//       if (event.code !== 1000) {
//         // 1000: Normal Closure
//         console.log('Attempting to reconnect WebSocket...');
//         setTimeout(initWebSocket, 1000); // 3초 후 재연결 시도
//       }
//       setWs(null); // WebSocket 객체를 null로 설정
//     };
//   };

//   const startStreaming = (socket: WebSocket) => {
//     console.log('open click start');
//     if (!socket || socket.readyState !== WebSocket.OPEN) {
//       console.log('WebSocket connection is not opened');
//       return;
//     }

//     const sendFrame = () => {
//       console.log('open send frame start');
//       if (videoRef.current && socket.readyState === WebSocket.OPEN) {
//         console.log('open canvas');
//         const canvas = document.createElement('canvas');
//         canvas.width = videoRef.current.videoWidth;
//         canvas.height = videoRef.current.videoHeight;
//         const ctx = canvas.getContext('2d');
//         if (!ctx) {
//           console.log('Failed to get 2D context');
//           return;
//         }
//         ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
//         const frame = canvas.toDataURL('image/jpeg').split(',')[1];

//         const message = {
//           type: 'video',
//           payload: frame,
//           device: 'mobile',
//           u_id: u_id,
//         };

//         console.log('Sending message:', message);
//         socket.send(JSON.stringify(message));
//       }
//     };

//     intervalRef.current = window.setInterval(sendFrame, 1000 / 30);
//     console.log('send img');
//   };

//   const stopStreaming = () => {
//     if (intervalRef.current) {
//       clearInterval(intervalRef.current);
//       intervalRef.current = null;
//     }
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
//   };

//   return (
//     <div>
//       <div>
//         <div>
//           <video
//             ref={videoRef}
//             autoPlay
//             style={{ width: '300px', height: '300px' }}
//           ></video>
//         </div>
//         <div>
//           <button id="startButton" className="button" onClick={initWebSocket}>
//             Start
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default CameraMobilePage;

import { useEffect, useRef, useState } from 'react';
import { useWebSocket } from './WebSocketContext';
import { useLocation } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const wsUrl = import.meta.env.VITE_SOCKET_URL;
// const u_id = localStorage.getItem('u_id');

function MobileCameraPage() {
  const query = useQuery();
  const u_id = query.get('u_id');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const { connectWebSocket, disconnectWebSocket, sendMessage } = useWebSocket();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startStreaming = () => {
    const constraints = { video: { facingMode: 'environment' } };
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          localStreamRef.current = stream;
          setIsStreaming(true);
          console.log('Mobile camera stream started:', stream);
          connectWebSocket(wsUrl);
        }
      })
      .catch((err) => {
        console.error('Error accessing mobile camera:', err);
        alert(
          '카메라 권한이 필요합니다. 브라우저 설정에서 카메라 권한을 허용해주세요.'
        );
      });
  };

  const stopStreaming = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    console.log('Mobile camera stream stopped');
    disconnectWebSocket(wsUrl);
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isStreaming) {
      intervalId = setInterval(() => {
        if (canvasRef.current && videoRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const fullImageData = canvas.toDataURL('image/png');
            const imageData = fullImageData.split(',')[1];
            setCapturedImage(fullImageData);
            const message = {
              u_id,
              type: 'all',
              device: 'mobile',
              payload: imageData,
            };

            sendMessage(wsUrl, message); // WebSocket으로 전송
            console.log('Image captured and sent:', message);
          }
        }
      }, 2000); // 2초마다 캡처
    }
    return () => clearInterval(intervalId);
  }, [isStreaming]);

  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-xl font-bold mb-6 mt-6 text-center">
        모바일 카메라 세팅을 시작하세요.
      </h1>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-64 mb-10 p-4 bg-white rounded-xl animate-border-glow"
      ></video>
      <div className="flex space-x-4">
        {!isStreaming ? (
          <button
            id="startButton"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={startStreaming}
          >
            Start Camera
          </button>
        ) : (
          <>
            {/* <button
              id="captureButton"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={captureAndSendImage}
            >
              Capture & Send
            </button> */}
            <button
              id="stopButton"
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={stopStreaming}
            >
              Stop Camera
            </button>
          </>
        )}
      </div>
      {capturedImage && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold text-center mb-2">
            Captured Image11
          </h2>
          <img
            src={capturedImage}
            alt="Captured"
            className="border rounded-lg"
          />
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
        width={640}
        height={480}
      />
    </div>
  );
}

export default MobileCameraPage;
