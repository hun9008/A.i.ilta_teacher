import { useEffect, useRef } from 'react';
import LaptopImage from './assets/Laptop.jpg';
import { useNavigate } from 'react-router-dom';

function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const constraints = {
      video: {
        facingMode: 'environment',
      },
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error('Error accessing camera: ', err);
      });

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        let stream = videoRef.current.srcObject as MediaStream;
        let tracks = stream.getTracks();

        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
      }}
    >
      <div style={{ display: 'flex', marginBottom: '20px' }}>
        <div style={{ marginRight: '100px' }}>
          <img src={LaptopImage} style={{ width: '300px', height: '300px' }} />
        </div>

        <div>
          <video
            ref={videoRef}
            autoPlay
            style={{ width: '300px', height: '300px' }}
          ></video>
        </div>
      </div>
      <button onClick={() => navigate('/StudyGoals')}>학습하기</button>
    </div>
  );
}

export default CameraPage;
