import { useState } from 'react';
import LaptopImage from './assets/Laptop.jpg';
import { useWebcamStream } from './WebcamStreamContext';
//import Webcam from 'react-webcam';

const wsUrl = import.meta.env.VITE_SOCKET_URL;
const u_id = localStorage.getItem('u_id');

function CameraPage() {
  const { startStreaming, stopStreaming, isStreaming } = useWebcamStream();
  const [capturedImage] = useState<string | null>(null);

  const handleStartStreaming = () => {
    startStreaming(wsUrl, u_id || '', 'video', 'pc');
  };

  const handleStopStreaming = () => {
    stopStreaming();
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-xl font-bold mb-6 mt-6 text-center">
        집중도를 확인하기 위해 카메라 세팅이 필요해요.
        <br />
        사진과 같이 카메라를 조정해주세요.
      </h1>
      <div className="flex flex-row items-center justify-center space-x-8">
        <div className="text-center">
          <img
            src={LaptopImage}
            className="w-72 h-72 mb-10 p-4 bg-white rounded-xl"
            alt="Laptop"
          />
        </div>
        <div className="text-center">
          {/*<Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/png"
            videoConstraints={{ facingMode: 'user' }}
            className="w-72 h-72 mb-10 p-4 bg-white rounded-xl animate-border-glow"
          />*/}
        </div>
      </div>
      
      <div className="flex space-x-4">
        {!isStreaming ? (
          <button
            id="startButton"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleStartStreaming}
          >
            Run
          </button>
        ) : (
          <button
            id="stopButton"
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={handleStopStreaming}
          >
            Stop
          </button>
        )}
      </div>
      {capturedImage && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold text-center mb-2">Captured Image</h2>
          <img src={capturedImage} alt="Captured" className="border rounded-lg" />
        </div>
      )}
    </div>
  );
}

export default CameraPage;