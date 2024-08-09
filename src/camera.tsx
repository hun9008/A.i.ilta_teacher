import React, { useEffect, useRef } from 'react';

function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const constraints = {
      video: {
        facingMode: 'environment'
      }
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("Error accessing camera: ", err);
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
    <div>
      <h1>Camera Web App</h1>
      <video
        ref={videoRef}
        autoPlay
      ></video>
    </div>
  );
};

export default CameraPage;
