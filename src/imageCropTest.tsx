import React, { useState, useRef, useEffect } from 'react';

declare global {
  interface Window {
    cv: any;
  }
}

const ImageCropTest: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);
  const [scale, setScale] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (image && canvasRef.current && editCanvasRef.current) {
      const canvas = canvasRef.current;
      const editCanvas = editCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const editCtx = editCanvas.getContext('2d');
      const img = new Image();
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
      img.src = image;
    }
  }, [image]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
        setShowPopup(true);
      };
      reader.readAsDataURL(file);
    }
  };

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
    if (!canvas || !image) return;

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
    img.src = image;
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
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: height },
        { x: 0, y: height }
      ];
    }
    setPoints(newPoints);
    [src, dst, gray, contours, hierarchy, approx].forEach(mat => mat.delete());
  };

  useEffect(() => {
    redrawEditCanvas();
  }, [points]);

  const cropImage = () => {
    if (!canvasRef.current || points.length !== 4 || !window.cv) return;
  
    const canvas = canvasRef.current;
    let src = window.cv.imread(canvas);
    let dst = new window.cv.Mat();
  
    const scale = canvas.width / editCanvasRef.current!.width;
    const scaledPoints = points.map(p => ({ x: p.x * scale, y: p.y * scale }));
  
    const orderedPoints = scaledPoints.sort((a, b) => a.y - b.y);
    const [tl, tr] = orderedPoints.slice(0, 2).sort((a, b) => a.x - b.x);
    const [bl, br] = orderedPoints.slice(2, 4).sort((a, b) => a.x - b.x);
  
    const width = Math.max(Math.hypot(br.x - bl.x, br.y - bl.y), Math.hypot(tr.x - tl.x, tr.y - tl.y));
    const height = Math.max(Math.hypot(tr.x - br.x, tr.y - br.y), Math.hypot(tl.x - bl.x, tl.y - bl.y));
  
    let dstTri = window.cv.matFromArray(4, 1, window.cv.CV_32FC2, [0, 0, width - 1, 0, width - 1, height - 1, 0, height - 1]);
    let srcTri = window.cv.matFromArray(4, 1, window.cv.CV_32FC2, [tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y]);
  
    let M = window.cv.getPerspectiveTransform(srcTri, dstTri);
    let dsize = new window.cv.Size(width, height);
    window.cv.warpPerspective(src, dst, M, dsize, window.cv.INTER_LINEAR, window.cv.BORDER_CONSTANT, new window.cv.Scalar());
  
    let tempCanvas = document.createElement('canvas');
    window.cv.imshow(tempCanvas, dst);
    setCroppedImage(tempCanvas.toDataURL());
  
    [src, dst, srcTri, dstTri, M].forEach(mat => mat.delete());
    setShowPopup(false);
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {image && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
          <canvas ref={canvasRef} />
        </div>
      )}
      {showPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '10px'
          }}>
            <canvas 
              ref={editCanvasRef}
              style={{ cursor: draggingPointIndex !== null ? 'grabbing' : 'grab' }}
              onMouseDown={handleCanvasInteraction} 
              onMouseMove={handleCanvasInteraction} 
              onMouseUp={handleCanvasInteraction}
            />
            <div>
              <button onClick={detectCorners}>Detect Corners</button>
              <button onClick={cropImage} disabled={points.length !== 4}>Crop Image</button>
            </div>
          </div>
        </div>
      )}
      {croppedImage && (
        <div>
          <h3>Cropped Image:</h3>
          <img src={croppedImage} alt="Cropped" style={{ maxWidth: '50%' }} />
        </div>
      )}
    </div>
  );
};

export default ImageCropTest;