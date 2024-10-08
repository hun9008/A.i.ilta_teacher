import React, { useEffect, useRef, useState } from 'react';
import { useWebSocket } from './WebSocketContext';

const wsUrl = import.meta.env.VITE_SOCKET_URL;

const PCControlPage: React.FC = () => {
  const { sendMessage, isConnected, imageData, setImageData } = useWebSocket();
  const u_id = localStorage.getItem('u_id');

  const [capturedPosition, setCapturedPosition] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [scale, setScale] = useState(0);
  const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(
    null
  );
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [isCornersDetected, setIsCornersDetected] = useState(false); // 모서리 찾기 상태
  const [isImageCropped, setIsImageCropped] = useState(false); // 이미지 자르기 상태

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleCaptureRequest = async () => {
    if (imageData) {
      setCapturedImage(imageData);
      setShowPopup(true);
    }
  };

  const sendRequest = async () => {
    if (!isConnected(wsUrl)) {
      console.error('WebSocket is not connected. Cannot send message.');
      return;
    }
    if (!croppedImage) {
      console.error('No cropped image available to send.');
      return;
    }
    try {
      const base64Image = croppedImage.split(',')[1];
      setImageData(base64Image);
      const message = {
        u_id,
        type: 'ocr',
        device: 'mobile',
        payload: base64Image,
        position: capturedPosition,
        ocrs: '',
      };
      sendMessage(wsUrl, message);
      console.log('Cropped image and position sent from PC');
    } catch (error) {
      console.error('Error sending cropped image and position:', error);
    }
  };

  useEffect(() => {
    if (croppedImage) {
      sendRequest();
    }
  }, [croppedImage]);

  useEffect(() => {
    if (
      showPopup &&
      capturedImage &&
      canvasRef.current &&
      editCanvasRef.current
    ) {
      const canvas = canvasRef.current;
      const editCanvas = editCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const editCtx = editCanvas.getContext('2d');
      const img = new Image();
      img.src = `data:image/png;base64,${capturedImage}`;
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
  }, [showPopup, capturedImage]);

  const handleCanvasInteraction = (event: React.MouseEvent) => {
    const canvas = editCanvasRef.current;
    if (!canvas || points.length !== 4) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (event.type === 'mousedown') {
      const pointIndex = points.findIndex(
        (p) => Math.hypot(p.x - x, p.y - y) < 10
      );
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
    if (!canvas || !capturedImage) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (points.length === 4) {
        ctx!.strokeStyle = 'blue';
        ctx!.lineWidth = 2;
        points.forEach((point) => {
          ctx!.beginPath();
          ctx!.arc(point.x, point.y, 5, 0, 2 * Math.PI);
          ctx!.fillStyle = 'blue';
          ctx!.fill();
          ctx!.stroke();
        });

        ctx!.beginPath();
        ctx!.moveTo(points[0].x, points[0].y);
        points.forEach((_, i) =>
          ctx!.lineTo(points[(i + 1) % 4].x, points[(i + 1) % 4].y)
        );
        ctx!.closePath();
        ctx!.stroke();
      }
    };
    img.src = `data:image/png;base64,${capturedImage}`;
  };

  useEffect(() => {
    redrawEditCanvas();
  }, [points, capturedImage]);

  const detectCorners = () => {
    if (!canvasRef.current || !window.cv) return;

    const canvas = canvasRef.current;
    let src = window.cv.imread(canvas);
    let dst = new window.cv.Mat();
    let gray = new window.cv.Mat();

    window.cv.cvtColor(src, gray, window.cv.COLOR_RGBA2GRAY);
    window.cv.GaussianBlur(gray, gray, new window.cv.Size(5, 5), 0);
    window.cv.adaptiveThreshold(
      gray,
      dst,
      255,
      window.cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      window.cv.THRESH_BINARY,
      11,
      2
    );
    window.cv.Canny(dst, dst, 50, 200);
    window.cv.dilate(
      dst,
      dst,
      window.cv.Mat.ones(3, 3, window.cv.CV_8U),
      new window.cv.Point(-1, -1),
      2
    );

    let contours = new window.cv.MatVector();
    let hierarchy = new window.cv.Mat();
    window.cv.findContours(
      dst,
      contours,
      hierarchy,
      window.cv.RETR_EXTERNAL,
      window.cv.CHAIN_APPROX_SIMPLE
    );

    let maxContour = [...Array(contours.size())].reduce((max, _, i) => {
      let contour = contours.get(i);
      return window.cv.contourArea(contour) > window.cv.contourArea(max)
        ? contour
        : max;
    }, contours.get(0));

    let approx = new window.cv.Mat();
    window.cv.approxPolyDP(
      maxContour,
      approx,
      0.02 * window.cv.arcLength(maxContour, true),
      true
    );

    let newPoints;
    if (approx.rows === 4) {
      newPoints = Array.from({ length: 4 }, (_, i) => ({
        x: approx.data32S[i * 2] * scale,
        y: approx.data32S[i * 2 + 1] * scale,
      }));
      setIsCornersDetected(true); // 모서리가 감지된 후 상태 변경
    } else {
      const width = canvas.width * scale;
      const height = canvas.height * scale;
      newPoints = [
        { x: 5, y: 5 },
        { x: width - 5, y: 5 },
        { x: width - 5, y: height - 5 },
        { x: 5, y: height - 5 },
      ];
    }
    setPoints(newPoints);
    [src, dst, gray, contours, hierarchy, approx].forEach((mat) =>
      mat.delete()
    );
  };

  const cropImage = () => {
    if (!canvasRef.current || points.length !== 4 || !window.cv) return;

    const canvas = canvasRef.current;
    let src = window.cv.imread(canvas);
    let dst = new window.cv.Mat();

    const scale = canvas.width / editCanvasRef.current!.width;
    const scaledPoints = points.map((p) => ({
      x: p.x * scale,
      y: p.y * scale,
    }));

    const orderedPoints = scaledPoints.sort((a, b) => a.y - b.y);
    const [tl, tr] = orderedPoints.slice(0, 2).sort((a, b) => a.x - b.x);
    const [bl, br] = orderedPoints.slice(2, 4).sort((a, b) => a.x - b.x);

    const width = Math.max(
      Math.hypot(br.x - bl.x, br.y - bl.y),
      Math.hypot(tr.x - tl.x, tr.y - tl.y)
    );
    const height = Math.max(
      Math.hypot(tr.x - br.x, tr.y - br.y),
      Math.hypot(tl.x - bl.x, tl.y - bl.y)
    );

    let dstTri = window.cv.matFromArray(4, 1, window.cv.CV_32FC2, [
      0,
      0,
      width - 1,
      0,
      width - 1,
      height - 1,
      0,
      height - 1,
    ]);
    let srcTri = window.cv.matFromArray(4, 1, window.cv.CV_32FC2, [
      tl.x,
      tl.y,
      tr.x,
      tr.y,
      br.x,
      br.y,
      bl.x,
      bl.y,
    ]);

    let M = window.cv.getPerspectiveTransform(srcTri, dstTri);
    let dsize = new window.cv.Size(width, height);
    window.cv.warpPerspective(
      src,
      dst,
      M,
      dsize,
      window.cv.INTER_LINEAR,
      window.cv.BORDER_CONSTANT,
      new window.cv.Scalar()
    );

    let tempCanvas = document.createElement('canvas');
    window.cv.imshow(tempCanvas, dst);
    setCroppedImage(tempCanvas.toDataURL('image/jpeg', 0.8));

    const positionObject = {
      left_top: `(${Math.round(tl.x)},${Math.round(tl.y)})`,
      right_top: `(${Math.round(tr.x)},${Math.round(tr.y)})`,
      right_bottom: `(${Math.round(br.x)},${Math.round(br.y)})`,
      left_bottom: `(${Math.round(bl.x)},${Math.round(bl.y)})`,
    };

    // position 객체를 JSON 문자열로 변환
    const positionString = JSON.stringify(positionObject);
    setCapturedPosition(positionString);

    [src, dst, srcTri, dstTri, M].forEach((mat) => mat.delete());

    setShowPopup(false);
    setIsImageCropped(true); // 이미지가 잘린 후 상태 변경
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        모바일 이미지 확인
      </h1>
      {imageData ? (
        <>
          <img
            src={`data:image/png;base64,${imageData}`}
            alt="Received from WebSocket"
            className="w-1/2 rounded-lg shadow-md mb-4"
          />
          <button
            onClick={handleCaptureRequest}
            className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-colors duration-300 mb-4"
          >
            캡쳐!
          </button>
          {showPopup && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
              onClick={() => setShowPopup(false)}
            >
              <div
                className="bg-white p-6 rounded-lg shadow-lg relative"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-center mb-4 font-semibold text-gray-700">
                  문제 영역에 맞게 모서리를 조정해주세요.
                </p>
                <div className="absolute top-[-9999px] left-[-9999px]">
                  <canvas ref={canvasRef} />
                </div>
                <div className="mb-4">
                  <canvas
                    ref={editCanvasRef}
                    className={`w-full h-full border border-gray-300 rounded-lg shadow-md ${
                      draggingPointIndex !== null
                        ? 'cursor-grabbing'
                        : 'cursor-grab'
                    }`}
                    onMouseDown={handleCanvasInteraction}
                    onMouseMove={handleCanvasInteraction}
                    onMouseUp={handleCanvasInteraction}
                  />
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={detectCorners}
                    className={`px-4 py-2 font-semibold rounded-lg shadow-md transition-colors duration-300 ${
                      isCornersDetected
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    모서리 찾기
                  </button>
                  <button
                    onClick={cropImage}
                    disabled={points.length !== 4}
                    className={`px-4 py-2 font-semibold rounded-lg shadow-md transition-colors duration-300 ${
                      points.length !== 4
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : isImageCropped
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    이미지 자르기
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-lg text-gray-600">모바일 카메라 정보를 받아들이고 있습니다!</p>
      )}
    </div>
  );
};

export default PCControlPage;
