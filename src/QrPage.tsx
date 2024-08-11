import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode.react';

function QrPage(){
  const navigate = useNavigate();

  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() =>{
    const email = localStorage.getItem('email');
    if(email) {
      const hostUrl = import.meta.env.VITE_HOST_URL;
      const qrCodeUrl = `${hostUrl}/camera?email=${encodeURIComponent(email)}`;
      setQrUrl(qrCodeUrl);
    }
  },[]);


  return (
    <>
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h1>Scan this QR Code</h1>
        {qrUrl && <QRCode value={qrUrl} size={256} />}
        <button onClick={()=>{navigate('/camera');}}>Camera</button>
        
      </div>
    </>
  );
};

export default QrPage;
