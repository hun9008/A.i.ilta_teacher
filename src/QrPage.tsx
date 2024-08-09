
import QRCode from 'qrcode.react';

function QrPage(){

  const cameraAppUrl = "http://127.0.0.1:5173/camera";

  return (
    <>
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h1>Scan this QR Code</h1>
        <QRCode value={cameraAppUrl} size={256} />
      </div>
    </>
  );
};

export default QrPage;
