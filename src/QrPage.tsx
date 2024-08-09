import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode.react';

function QrPage(){
  const navigate = useNavigate();
  const cameraAppUrl = "https://front-web--iridescent-bombolone-b67e0e.netlify.app/";

  return (
    <>
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h1>Scan this QR Code</h1>
        <QRCode value={cameraAppUrl} size={256} />
        <button onClick={()=>{navigate('/camera');}}>Camera</button>
      </div>
    </>
  );
};

export default QrPage;
