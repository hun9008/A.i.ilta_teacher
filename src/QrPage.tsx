import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode.react';
import { useWebSocket } from './WebSocketContext';

function QrPage() {
  const navigate = useNavigate();
  const { sendMessage, connectWebSocket, isConnected } = useWebSocket();
  const [qrUrl, setQrUrl] = React.useState<string>('');

  useEffect(() => {
    const email = localStorage.getItem('email');
    const u_id = localStorage.getItem('u_id');

    if (email && u_id) {
      const hostUrl = import.meta.env.VITE_HOST_URL;
      const qrCodeUrl = `${hostUrl}/camera-mobile?email=${encodeURIComponent(
        email
      )}&u_id=${encodeURIComponent(u_id)}`;
      setQrUrl(qrCodeUrl);
    }
  }, []);

  const handleStartStudy = () => {
    const u_id = localStorage.getItem('u_id');
    if (u_id) {
      if (!isConnected) {
        connectWebSocket(); // Connect WebSocket when the button is clicked
      }

      sendMessage({
        u_id,
        status: 'open',
        text: '',
      });
      console.log('Sent status: open message to server.');

      navigate('/StudyMain'); // Navigate to the study page
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-xl font-bold mb-6 mt-6 text-center">
        스마트폰 카메라로
        <br />
        아래 QR코드를 스캔하세요
      </h1>
      {qrUrl && (
        <QRCode
          value={qrUrl}
          size={200}
          className="mb-10 p-4 bg-white rounded-xl animate-border-glow"
        />
      )}

      <button onClick={() => navigate('/MobileScreen')}>MobileCamera</button>
      <button onClick={() => navigate('/camera')}>LaptopCamera</button>
      <button onClick={handleStartStudy}>공부시작하기</button>
    </div>
  );
}

export default QrPage;
