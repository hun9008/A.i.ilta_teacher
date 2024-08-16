import { useEffect, useRef, useState } from 'react';
import { useWebSocket } from './WebSocketContext';

const wsUrl = import.meta.env.VITE_SOCKET_URL;
const u_id = localStorage.getItem('u_id');

function MobileCameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const { connectWebSocket, disconnectWebSocket, sendMessage } = useWebSocket();

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

  const captureAndSendImage = () => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const fullImageData = canvas.toDataURL('image/png');
        const imageData = fullImageData.split(',')[1]; // 메타데이터 제거 후 인코딩된 데이터 추출

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
  };

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
            <button
              id="captureButton"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={captureAndSendImage}
            >
              Capture & Send
            </button>
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

// import { useEffect, useRef, useState } from 'react';
// // @ts-ignore
// import Scanner from 'react-scanner';

// const DocumentScanner = () => {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const [scannedImage, setScannedImage] = useState<string | null>(null);
//   const localStreamRef = useRef<MediaStream | null>(null);

//   const startStreaming = () => {
//     const constraints = { video: { facingMode: 'environment' } };
//     navigator.mediaDevices
//       .getUserMedia(constraints)
//       .then((stream) => {
//         if (videoRef.current) {
//           videoRef.current.srcObject = stream;
//           localStreamRef.current = stream;
//           console.log('Camera stream started:', stream);
//         }
//       })
//       .catch((err) => {
//         console.error('Error accessing camera:', err);
//         alert(
//           '카메라 권한이 필요합니다. 브라우저 설정에서 카메라 권한을 허용해주세요.'
//         );
//       });
//   };

//   const stopStreaming = () => {
//     if (localStreamRef.current) {
//       localStreamRef.current.getTracks().forEach((track) => track.stop());
//       localStreamRef.current = null;
//     }
//     if (videoRef.current) {
//       videoRef.current.srcObject = null;
//     }
//     console.log('Camera stream stopped');
//   };

//   const handleScan = (imageData: string) => {
//     setScannedImage(imageData);
//   };

//   useEffect(() => {
//     startStreaming(); // 컴포넌트가 마운트되면 스트리밍 시작

//     return () => {
//       stopStreaming(); // 컴포넌트가 언마운트될 때 스트리밍 중지
//     };
//   }, []);

//   return (
//     <div>
//       <h1>Document Scanner</h1>
//       {/* 스트리밍 비디오 표시 */}
//       <video
//         ref={videoRef}
//         autoPlay
//         playsInline
//         style={{
//           width: '640px',
//           height: '480px',
//           border: '1px solid #ccc',
//           backgroundColor: '#000',
//         }}
//       ></video>

//       {/* Scanner 컴포넌트 (보이지 않도록 설정하고 스캔 기능만 사용) */}
//       <Scanner
//         onScan={handleScan} // 스캔 완료 후 호출되는 콜백
//         width={640}
//         height={480}
//         facingMode="environment" // 후면 카메라 사용
//         style={{ display: 'none' }} // 화면에 표시하지 않음
//       />

//       {scannedImage && (
//         <div>
//           <h2>Scanned Image</h2>
//           <img
//             src={scannedImage}
//             alt="Scanned Document"
//             style={{
//               border: '1px solid #ccc',
//               marginTop: '10px',
//               maxWidth: '100%',
//             }}
//           />
//         </div>
//       )}
//     </div>
//   );
// };

// export default DocumentScanner;
