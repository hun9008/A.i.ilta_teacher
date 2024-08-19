// import { useWebSocket } from './WebSocketContext';

// const wsUrl = import.meta.env.VITE_SOCKET_URL;

// function PCControlPage() {
//   const { sendMessage, isConnected, imageData, ocrResponse } = useWebSocket();
//   const u_id = localStorage.getItem('u_id');

//   const handleCaptureRequest = () => {
//     if (!isConnected(wsUrl)) {
//       console.error('WebSocket is not connected. Cannot send message.');
//       return;
//     }

//     const message = {
//       u_id,
//       type: 'all',
//       device: 'mobile',
//       payload: imageData,
//     };
//     sendMessage(wsUrl, message);
//     console.log('Capture request sent from PC');
//   };

//   return (
//     <div>
//       <h1>PC Control Page</h1>
//       {imageData ? (
//         <img
//           src={`data:image/png;base64,${imageData}`}
//           alt="Received from WebSocket"
//         />
//       ) : (
//         <p>No image data received</p>
//       )}
//       <button onClick={handleCaptureRequest}>Capture Image from Mobile</button>
//       {ocrResponse ? (
//         ocrResponse
//       ) : (
//         <p>No image data received</p>
//       )}
//     </div>
//   );
// }

// export default PCControlPage;

import React from 'react';
import { useWebSocket } from './WebSocketContext';
import ProblemImg from './assets/problem_img.png';

const wsUrl = import.meta.env.VITE_SOCKET_URL;

const PCControlPage: React.FC = () => {
  const { sendMessage, isConnected, imageData, ocrResponse } = useWebSocket();
  const u_id = localStorage.getItem('u_id');

  const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleCaptureRequest = async () => {
    if (!isConnected(wsUrl)) {
      console.error('WebSocket is not connected. Cannot send message.');
      return;
    }

    try {
      const base64Image = await convertImageToBase64(ProblemImg);

      // Construct the message
      const message = {
        u_id,
        type: 'all',
        device: 'mobile',
        payload: base64Image,
      };

      sendMessage(wsUrl, message);
      console.log('Capture request sent from PC');
    } catch (error) {
      console.error('Error converting image to Base64:', error);
    }
  };

  return (
    <div>
      <h1>PC Control Page</h1>
      {imageData ? (
        <img
          src={`data:image/jpeg;base64,${imageData}`}
          alt="Received from WebSocket"
        />
      ) : (
        <p>No image data received</p>
      )}
      <button onClick={handleCaptureRequest}>Capture Image from Mobile</button>
      {ocrResponse ? <div>{ocrResponse}</div> : <p>No OCR response received</p>}
    </div>
  );
};

export default PCControlPage;
