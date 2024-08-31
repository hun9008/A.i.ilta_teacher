import React, { useEffect } from 'react';
import QRCode from 'qrcode.react';

function QrPage() {const [qrUrl, setQrUrl] = React.useState<string>('');

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
    </div>
  );
}

export default QrPage;
