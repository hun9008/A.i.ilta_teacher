import React, { useEffect, useRef, useState } from 'react';

const VideoDisplay: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(import.meta.env.VITE_SOCKET_URL); // 서버 주소로 수정

    ws.onopen = () => {
      console.log('WebSocket connection established');
      websocketRef.current = ws;
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'rtc-frame') {
        setImageSrc(message.payload);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      websocketRef.current = null;
    };

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  return (
    <div>
      {imageSrc && (
        <img src={imageSrc} alt="Video Frame" style={{ width: '100%' }} />
      )}
    </div>
  );
};

export default VideoDisplay;
