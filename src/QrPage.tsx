import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode.react';

function QrPage() {
  const navigate = useNavigate();
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    const email = localStorage.getItem('email');
    const u_id = localStorage.getItem('u_id');

    if (email && u_id) {
      const hostUrl = import.meta.env.VITE_HOST_URL;
      const qrCodeUrl = `${hostUrl}/camera-mobile?email=${encodeURIComponent(email)}`;
      setQrUrl(qrCodeUrl);
    }

    try {
      const wsUrl = import.meta.env.VITE_SOCKET_URL;
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        console.log('WebSocket connection opened');
      };
      ws.onmessage = (event: MessageEvent) => {
        const message = JSON.parse(event.data);
        console.log('Message from server: ', message);
      };
      ws.onclose = () => {
        console.log('WebSocket connection closed');
      };
      ws.onerror = (error: Event) => {
        console.error('WebSocket error: ', error);
      };
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-xl font-bold mb-6 mt-6 text-center">
        스마트폰 카메라로
        <br />
        아래 QRcode를 스캔하세요
      </h1>
      {qrUrl && (
        <QRCode
          value={qrUrl}
          size={200}
          className="mb-10 p-4 bg-white rounded-xl animate-border-glow"
        />
      )}

      <button
        onClick={() => {
          navigate('/MobileScreen');
        }}
      >
        MobileCamera
      </button>
      <button
        onClick={() => {
          navigate('/camera');
        }}
      >
        LaptopCamera
      </button>
    </div>
  );
}

export default QrPage;
