// import { useEffect, useRef, useState } from 'react';
// import { useWebSocket } from './WebSocketContext';
// import { useLocation } from 'react-router-dom';

// function useQuery() {
//   return new URLSearchParams(useLocation().search);
// }

// const wsUrl = import.meta.env.VITE_SOCKET_URL;

// function MobileCameraPage() {
//   const query = useQuery();
//   const u_id = query.get('u_id');
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const localStreamRef = useRef<MediaStream | null>(null);
//   const [isStreaming, setIsStreaming] = useState(false);
//   const { connectWebSocket, disconnectWebSocket, sendMessage, lastResponse } =
//     useWebSocket();
//   const [capturedImage, setCapturedImage] = useState<string | null>(null);

//   const startStreaming = () => {
//     const constraints = { video: { facingMode: 'environment' } };
//     navigator.mediaDevices
//       .getUserMedia(constraints)
//       .then((stream) => {
//         if (videoRef.current) {
//           videoRef.current.srcObject = stream;
//           localStreamRef.current = stream;
//           setIsStreaming(true);
//           console.log('Mobile camera stream started:', stream);
//           connectWebSocket(wsUrl);
//         }
//       })
//       .catch((err) => {
//         console.error('Error accessing mobile camera:', err);
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
//     setIsStreaming(false);
//     console.log('Mobile camera stream stopped');
//     disconnectWebSocket(wsUrl);
//   };

//   const handleResponseFromServer = () => {
//     if (canvasRef.current && videoRef.current) {
//       const canvas = canvasRef.current;
//       const ctx = canvas.getContext('2d');
//       if (ctx) {
//         ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
//         const fullImageData = canvas.toDataURL('image/png');
//         const imageData = fullImageData.split(',')[1];
//         const message = {
//           u_id,
//           type: 'all',
//           device: 'mobile',
//           payload: imageData,
//         };

//         sendMessage(wsUrl, message);
//         console.log('Response received, sending type: all message:', message);
//       }
//     }
//   };

//   useEffect(() => {
//     let intervalId: NodeJS.Timeout;

//     if (isStreaming) {
//       intervalId = setInterval(() => {
//         if (canvasRef.current && videoRef.current) {
//           const canvas = canvasRef.current;
//           const ctx = canvas.getContext('2d');
//           if (ctx) {
//             ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
//             const fullImageData = canvas.toDataURL('image/png');
//             const imageData = fullImageData.split(',')[1];
//             setCapturedImage(fullImageData);
//             const message = {
//               u_id,
//               type: 'video',
//               device: 'mobile',
//               payload: imageData,
//             };

//             sendMessage(wsUrl, message); // WebSocket으로 전송
//             console.log('Image captured and sent:', message);
//           }
//         }
//       }, 1000);

//       return () => {
//         clearInterval(intervalId);
//       };
//     }
//   }, [isStreaming]);

//   useEffect(() => {
//     if (lastResponse === 'response') {
//       handleResponseFromServer();
//     }
//   }, [lastResponse]);

//   useEffect(() => {
//     return () => {
//       if (localStreamRef.current) {
//         localStreamRef.current.getTracks().forEach((track) => track.stop());
//       }
//     };
//   }, []);

//   return (
//     <div className="flex flex-col items-center justify-center bg-gray-50">
//       <h1 className="text-xl font-bold mb-6 mt-6 text-center">
//         모바일 카메라 세팅을 시작하세요.
//       </h1>
//       <video
//         ref={videoRef}
//         autoPlay
//         playsInline
//         className="w-full h-64 mb-10 p-4 bg-white rounded-xl animate-border-glow"
//       ></video>
//       <div className="flex space-x-4">
//         {!isStreaming ? (
//           <button
//             id="startButton"
//             className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//             onClick={startStreaming}
//           >
//             Start Camera
//           </button>
//         ) : (
//           <button
//             id="stopButton"
//             className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
//             onClick={stopStreaming}
//           >
//             Stop Camera
//           </button>
//         )}
//       </div>
//       {capturedImage && (
//         <div className="mt-4">
//           <h2 className="text-lg font-semibold text-center mb-2">
//             Captured Image
//           </h2>
//           <img
//             src={capturedImage}
//             alt="Captured"
//             className="border rounded-lg"
//           />
//         </div>
//       )}
//       <canvas
//         ref={canvasRef}
//         style={{ display: 'none' }}
//         width={640}
//         height={480}
//       />
//     </div>
//   );
// }

// export default MobileCameraPage;

import { useEffect, useRef, useState } from 'react';
import { useWebSocket } from './WebSocketContext';
import { useLocation } from 'react-router-dom';
declare var cv: any;

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const wsUrl = import.meta.env.VITE_SOCKET_URL;

function MobileCameraPage() {
  const query = useQuery();
  const u_id = query.get('u_id');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const { connectWebSocket, disconnectWebSocket, sendMessage, lastResponse } =
    useWebSocket();
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
  const handleResponseFromServer = () => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw the current frame from the video onto the canvas
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // Get the image data from the canvas
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const src = cv.matFromImageData(imageData);

        // Convert to grayscale
        let gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

        // Apply GaussianBlur to reduce noise
        let blurred = new cv.Mat();
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

        // Apply adaptive thresholding
        let binary = new cv.Mat();
        cv.adaptiveThreshold(
          blurred,
          binary,
          255,
          cv.ADAPTIVE_THRESH_GAUSSIAN_C,
          cv.THRESH_BINARY,
          11,
          2
        );

        // Optional: Apply morphological operations to clean up the image
        let kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
        let morphed = new cv.Mat();
        cv.morphologyEx(binary, morphed, cv.MORPH_CLOSE, kernel);

        // Display the processed image back onto the canvas
        cv.imshow(canvas, morphed);

        // Cleanup memory to avoid leaks
        src.delete();
        gray.delete();
        blurred.delete();
        binary.delete();
        morphed.delete();
        kernel.delete();

        // Convert the processed canvas back to a Data URL
        const processedImageData = canvas.toDataURL('image/png');
        const imageDataBase64 = processedImageData.split(',')[1];

        // Create the message with processed image data
        const message = {
          u_id,
          type: 'all',
          device: 'mobile',
          payload: imageDataBase64,
        };

        // Send the processed image via WebSocket
        sendMessage(wsUrl, message);
        console.log('Processed image sent:', message);
      }
    }
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
              type: 'video',
              device: 'mobile',
              payload: imageData,
            };

            sendMessage(wsUrl, message); // WebSocket으로 전송
            console.log('Image captured and sent:', message);
          }
        }
      }, 1000);

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [isStreaming]);

  useEffect(() => {
    if (lastResponse === 'response') {
      handleResponseFromServer();
    }
  }, [lastResponse]);

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
          <button
            id="stopButton"
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={stopStreaming}
          >
            Stop Camera
          </button>
        )}
      </div>
      {capturedImage && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold text-center mb-2">
            Captured Image
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
