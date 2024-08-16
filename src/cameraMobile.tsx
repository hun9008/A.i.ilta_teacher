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

import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import Scanner from 'react-scanner';

const DocumentScanner = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const startStreaming = () => {
    const constraints = { video: { facingMode: 'environment' } };
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          localStreamRef.current = stream;
          console.log('Camera stream started:', stream);
        }
      })
      .catch((err) => {
        console.error('Error accessing camera:', err);
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
    console.log('Camera stream stopped');
  };

  const handleScan = (imageData: string) => {
    setScannedImage(imageData);
  };

  useEffect(() => {
    startStreaming(); // 컴포넌트가 마운트되면 스트리밍 시작

    return () => {
      stopStreaming(); // 컴포넌트가 언마운트될 때 스트리밍 중지
    };
  }, []);

  return (
    <div>
      <h1>Document Scanner</h1>
      {/* 스트리밍 비디오 표시 */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: '640px',
          height: '480px',
          border: '1px solid #ccc',
          backgroundColor: '#000',
        }}
      ></video>

      {/* Scanner 컴포넌트 (보이지 않도록 설정하고 스캔 기능만 사용) */}
      <Scanner
        onScan={handleScan} // 스캔 완료 후 호출되는 콜백
        width={640}
        height={480}
        facingMode="environment" // 후면 카메라 사용
        style={{ display: 'none' }} // 화면에 표시하지 않음
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
