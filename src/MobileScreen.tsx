import { useEffect, useRef, useState } from 'react';

function LaptopScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    initWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const initWebSocket = () => {
    const ws = new WebSocket(import.meta.env.VITE_SOCKET_URL);

    ws.onopen = () => {
      console.log('WebSocket connection opened');
    };

    ws.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === 'video-frame') {
        updateCanvas(data.payload);
      } else if (data.type === 'ocr-result') {
        console.log('OCR Result:', data.text);
        // OCR 결과를 화면에 표시하는 로직을 여기에 추가할 수 있습니다.
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setErrorMessage('WebSocket error occurred. Check console for details.');
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    wsRef.current = ws;
  };

  const updateCanvas = (imageData: string) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
        };
        img.src = `data:image/jpeg;base64,${imageData}`;
      }
    }
  };

  return (
    <div>
      <h1>Laptop Screen</h1>
      <canvas
        ref={canvasRef}
        style={{ border: '1px solid black', maxWidth: '100%' }}
      ></canvas>
      {errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>}
    </div>
  );
}

export default LaptopScreen;
