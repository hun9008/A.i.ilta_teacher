import { useEffect, useRef } from 'react';
import LaptopImage from './assets/Laptop.jpg';

function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);

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
  );
}

export default CameraPage;
