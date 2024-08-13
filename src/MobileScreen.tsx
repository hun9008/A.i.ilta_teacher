import { useEffect, useRef } from 'react';

function LaptopPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    wsRef.current = new WebSocket(import.meta.env.VITE_SOCKET_URL);

    wsRef.current.onopen = () => {
      console.log('WebSocket connection opened on laptop');
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'video-frame') {
        const img = new Image();
        img.src = data.payload;

        img.onload = () => {
          if (canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
              context.drawImage(
                img,
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height
              );
            }
          }
        };
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error on laptop:', error);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket connection closed on laptop');
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return (
    <div>
      <h1>Mobile Camera Stream</h1>
      <canvas ref={canvasRef} style={{ width: '500px', height: '500px' }} />
    </div>
  );
}

export default LaptopPage;
