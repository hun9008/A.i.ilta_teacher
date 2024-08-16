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

import { useState } from 'react';
// @ts-ignore
import Scanner from 'react-scanner';
// import { useWebSocket } from './WebSocketContext';

const DocumentScanner = () => {
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  // const { sendMessage } = useWebSocket();

  const handleScan = (imageData: string) => {
    setScannedImage(imageData);
    // 스캔된 이미지를 서버로 전송
    /*

    sendMessage('ws://your_server_url', {
      type: 'all',
      payload: imageData.split(',')[1], // 메타데이터 제거 후 전송
    });
    */
  };

  return (
    <div>
      <h1>Document Scanner</h1>
      <Scanner
        onScan={handleScan} // 스캔 완료 후 호출되는 콜백
        width={640}
        height={480}
        facingMode="environment" // 후면 카메라 사용
      />
      {scannedImage && (
        <div>
          <h2>Scanned Image</h2>
          <img
            src={scannedImage}
            alt="Scanned Document"
            style={{
              border: '1px solid #ccc',
              marginTop: '10px',
              maxWidth: '100%',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DocumentScanner;
