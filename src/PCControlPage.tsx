// import { useWebSocket } from './WebSocketContext';

// const wsUrl = import.meta.env.VITE_SOCKET_URL;

// function PCControlPage() {
//   const { sendMessage, isConnected, imageData, ocrResponse } = useWebSocket();
//   const u_id = localStorage.getItem('u_id');

//   const handleCaptureRequest = () => {
//     if (!isConnected(wsUrl)) {
//       console.error('WebSocket is not connected. Cannot send message.');
//       return;
//     }

//     const message = {
//       u_id,
//       type: 'all',
//       device: 'mobile',
//       payload: imageData,
//     };
//     sendMessage(wsUrl, message);
//     console.log('Capture request sent from PC');
//   };

//   return (
//     <div>
//       <h1>PC Control Page</h1>
//       {imageData ? (
//         <img
//           src={`data:image/png;base64,${imageData}`}
//           alt="Received from WebSocket"
//         />
//       ) : (
//         <p>No image data received</p>
//       )}
//       <button onClick={handleCaptureRequest}>Capture Image from Mobile</button>
//       {ocrResponse ? (
//         ocrResponse
//       ) : (
//         <p>No image data received</p>
//       )}
//     </div>
//   );
// }

// export default PCControlPage;

import React, { useEffect, useRef, useState } from 'react';
import { useWebSocket } from './WebSocketContext';
import ProblemImg from './assets/problem_img.png';

const wsUrl = import.meta.env.VITE_SOCKET_URL;

const PCControlPage: React.FC = () => {
  const { sendMessage, isConnected, imageData } = useWebSocket();
  const u_id = localStorage.getItem('u_id');

  const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleCaptureRequest = async () => {
    if (!isConnected(wsUrl)) {
      console.error('WebSocket is not connected. Cannot send message.');
      return;
    }

    try {
      const base64Image = await convertImageToBase64(ProblemImg);

      // Construct the message
      const message = {
        u_id,
        type: 'all',
        device: 'mobile',
        payload: base64Image,
        position: '',
      };

      sendMessage(wsUrl, message);
      console.log('Capture request sent from PC');
    } catch (error) {
      console.error('Error converting image to Base64:', error);
    }
  };

  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editCanvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(0);
  const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);



  useEffect(() => {
    if (imageData && canvasRef.current && editCanvasRef.current) {
      const canvas = canvasRef.current;
      const editCanvas = editCanvasRef.current;
      if(canvas){
        const ctx = canvas.getContext('2d');
        const editCtx = editCanvas.getContext('2d');
        const img = new Image();
        img.src = `data:image/png;base64,${imageData}`;
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);

          const calculatedScale = 300 / img.width;
          setScale(calculatedScale);

          editCanvas.width = img.width * calculatedScale;
          editCanvas.height = img.height * calculatedScale;
          editCtx?.drawImage(img, 0, 0, editCanvas.width, editCanvas.height);
        };
      }
    }
  }, [imageData]);

  const handleCanvasInteraction = (event: React.MouseEvent) => {
    const canvas = editCanvasRef.current;
    if (!canvas || points.length !== 4) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left);
    const y = (event.clientY - rect.top);

    if (event.type === 'mousedown') {
      const pointIndex = points.findIndex(p => Math.hypot(p.x - x, p.y - y) < 10);
      if (pointIndex !== -1) setDraggingPointIndex(pointIndex);
    } else if (event.type === 'mousemove' && draggingPointIndex !== null) {
      const newPoints = [...points];
      newPoints[draggingPointIndex] = { x, y };
      setPoints(newPoints);
      redrawEditCanvas();
    } else if (event.type === 'mouseup') {
      setDraggingPointIndex(null);
    }
  };

  const redrawEditCanvas = () => {
    const canvas = editCanvasRef.current;
    if (!canvas || !imageData) return;

    console.log("2");
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (points.length === 4) {
        ctx!.strokeStyle = 'purple';
        ctx!.lineWidth = 2;
        points.forEach(point => {
          ctx!.beginPath();
          ctx!.arc(point.x , point.y , 5, 0, 2 * Math.PI);
          ctx!.fillStyle = 'purple';
          ctx!.fill();
          ctx!.stroke();
        });

        ctx!.beginPath();
        ctx!.moveTo(points[0].x, points[0].y);
        points.forEach((_, i) => ctx!.lineTo(points[(i + 1) % 4].x, points[(i + 1) % 4].y));
        ctx!.closePath();
        ctx!.stroke();
      }
    };
    img.src = imageData;
  };

  const detectCorners = () => {
    if (!canvasRef.current || !window.cv) return;

    const canvas = canvasRef.current;
    let src = window.cv.imread(canvas);
    let dst = new window.cv.Mat();
    let gray = new window.cv.Mat();

    window.cv.cvtColor(src, gray, window.cv.COLOR_RGBA2GRAY);
    window.cv.GaussianBlur(gray, gray, new window.cv.Size(5, 5), 0);
    window.cv.adaptiveThreshold(gray, dst, 255, window.cv.ADAPTIVE_THRESH_GAUSSIAN_C, window.cv.THRESH_BINARY, 11, 2);
    window.cv.Canny(dst, dst, 50, 200);
    window.cv.dilate(dst, dst, window.cv.Mat.ones(3, 3, window.cv.CV_8U), new window.cv.Point(-1, -1), 2);

    let contours = new window.cv.MatVector();
    let hierarchy = new window.cv.Mat();
    window.cv.findContours(dst, contours, hierarchy, window.cv.RETR_EXTERNAL, window.cv.CHAIN_APPROX_SIMPLE);

    let maxContour = [...Array(contours.size())].reduce((max, _, i) => {
      let contour = contours.get(i);
      return window.cv.contourArea(contour) > window.cv.contourArea(max) ? contour : max;
    }, contours.get(0));

    let approx = new window.cv.Mat();
    window.cv.approxPolyDP(maxContour, approx, 0.02 * window.cv.arcLength(maxContour, true), true);

    let newPoints;
    if (approx.rows === 4) {
      newPoints = Array.from({ length: 4 }, (_, i) => ({
        x: approx.data32S[i * 2] * scale,
        y: approx.data32S[i * 2 + 1] * scale
      }));
    } else {
      const width = canvas.width * scale;
      const height = canvas.height * scale;
      newPoints = [
        { x: 0, y: 0 },                // 좌상단 (lt)
        { x: width, y: 0 },            // 우상단 (rt)
        { x: width, y: height },       // 우하단 (rb)
        { x: 0, y: height }            // 좌하단 (lb)
      ];
    }
    setPoints(newPoints);
    [src, dst, gray, contours, hierarchy, approx].forEach(mat => mat.delete());
  };

  return (
    <div>
      <h1>PC Control Page</h1>
      {imageData ? (
        <>
          <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
            <canvas ref={canvasRef} />
          </div>
          <div>
            <canvas
              ref={editCanvasRef}
              style={{ cursor: draggingPointIndex !== null ? 'grabbing' : 'grab' }}
              onMouseDown={handleCanvasInteraction} 
              onMouseMove={handleCanvasInteraction} 
              onMouseUp={handleCanvasInteraction}
            />
          </div>
          <button onClick={detectCorners}>Detect Corners</button>
        </>
      ) : (
        <p>No image data received</p>
      )}
      <button onClick={handleCaptureRequest}>Capture Image from Mobile</button>
    </div>
  );
};

export default PCControlPage;
