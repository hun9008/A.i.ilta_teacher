// import { useEffect, useState, useRef } from 'react';
// import LaptopImage from './assets/Laptop.jpg';

// function VideoDisplay() {
//   const u_id = localStorage.getItem('u_id');
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const [ws, setWs] = useState<WebSocket | null>(null);

//   const intervalRef = useRef<number | null>(null);
//   const [imageSrc, setImageSrc] = useState<string>('');
//   const localStreamRef = useRef<MediaStream | null>(null);
//   const animationFrameRef = useRef<number | null>(null);

//   useEffect(() => {
//     if (!u_id) {
//       console.log('no u_id');
//       return;
//     }

//     if (!ws) {
//       initWebSocket();
//     }

//     return () => {
//       stopStreaming();
//     };
//   }, [u_id, ws]);

//   const initWebSocket = () => {
//     if (ws && ws.readyState !== WebSocket.CLOSED) {
//       console.log('WebSocket is already opened or connecting');
//       return;
//     }

//     const socket = new WebSocket(import.meta.env.VITE_SOCKET_URL);

//     socket.onopen = () => {
//       console.log('WebSocket connection opened');
//       setWs(socket); // WebSocket 객체 상태 업데이트

//       // WebSocket 연결이 열렸을 때 스트리밍 시작
//       startStreaming(socket);
//     };

//     socket.onmessage = (message) => {
//       console.log('Message received:', message);
//       const data = JSON.parse(message.data);

//       // 모바일에서 보낸 이미지를 수신하여 화면에 표시
//       const imgData = `data:image/jpeg;base64,${data.payload}`;
//       setImageSrc(imgData); // 이미지 상태 업데이트
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
//         console.log('Attempting to reconnect WebSocket...');
//         setTimeout(initWebSocket, 1000); // 1초 후 재연결 시도
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
//       const canvas = document.createElement('canvas');
//       const ctx = canvas.getContext('2d');
//       if (!ctx) {
//         console.log('Failed to get 2D context');
//         return;
//       }
//       const frame = canvas.toDataURL('image/jpeg').split(',')[1];

//       const message = {
//         type: 'rtc',
//         payload: frame,
//         device: 'pc',
//         u_id: u_id,
//       };

//       console.log('Sending message:', message);
//       socket.send(JSON.stringify(message)); // 프레임 데이터와 함께 PC 정보 전송
//     };

//     animationFrameRef.current = requestAnimationFrame(() => sendFrame());
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
//     <div className="flex flex-col items-center justify-center bg-gray-50">
//       <h1 className="text-xl font-bold mb-6 mt-6 text-center">
//         학습할 문제집 사진이 필요해요.
//         <br />
//         사진과 같이 문제집 정보가 카메라에 담길 수 있도록 해주세요.
//       </h1>
//       <div className="flex flex-row items-center justify-center space-x-8">
//         <div className="text-center">
//           <img
//             src={LaptopImage}
//             className="w-72 h-72 mb-10 p-4 bg-white rounded-xl animate-border-glow"
//           />
//         </div>
//         <div className="w-72 h-72 mb-10 p-4 bg-white rounded-xl flex items-center justify-center">
//           {imageSrc ? (
//             <img
//               src={imageSrc}
//               alt="Captured Frame"
//               className="rounded-xl w-full h-full object-cover"
//             />
//           ) : (
//             <p>No image received</p>
//           )}
//         </div>
//       </div>
//       <div className="flex space-x-4">
//         <button
//           id="startButton"
//           className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//           onClick={initWebSocket}
//         >
//           Start
//         </button>
//       </div>
//     </div>
//   );
// }

// export default VideoDisplay;

import { useEffect, useState } from 'react';
import { useWebSocket } from './WebSocketContext';

const wsUrl = import.meta.env.VITE_SOCKET_URL;

function PCLiveFeed() {
  const { connectWebSocket, disconnectWebSocket, getSocket } = useWebSocket();
  const [imageData, setImageData] = useState<string | null>(null);

  useEffect(() => {
    // WebSocket 연결
    connectWebSocket(wsUrl);

    const socket = getSocket(wsUrl);
    if (socket) {
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'rtc-frame') {
          // Base64로 인코딩된 이미지 데이터를 수신하여 상태에 저장
          const base64Image = `data:image/png;base64,${message.payload}`;
          setImageData(base64Image);
        }
      };
    }

    return () => {
      // 컴포넌트 언마운트 시 WebSocket 연결 해제
      disconnectWebSocket(wsUrl);
    };
  }, [connectWebSocket, disconnectWebSocket, getSocket]);

  return (
    <div className="flex flex-col items-center justify-center bg-gray-50 h-screen">
      <h1 className="text-xl font-bold mb-6 mt-6 text-center">PC Live Feed</h1>
      {imageData ? (
        <img
          src={imageData}
          alt="Live Feed"
          className="border rounded-lg w-full max-w-lg"
        />
      ) : (
        <p className="text-center">No feed available</p>
      )}
    </div>
  );
}

export default PCLiveFeed;
