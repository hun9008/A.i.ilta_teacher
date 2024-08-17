import { useWebSocket } from './WebSocketContext';

const wsUrl = import.meta.env.VITE_SOCKET_URL;

function PCControlPage() {
  const { sendMessage, isConnected } = useWebSocket();
  const u_id = localStorage.getItem('u_id');

  const handleCaptureRequest = () => {
    if (!isConnected(wsUrl)) {
      console.error('WebSocket is not connected. Cannot send message.');
      return;
    }

    const message = {
      u_id,
      type: 'hi',
      device: 'pc',
      payload: null,
    };
    sendMessage(wsUrl, message);
    console.log('Capture request sent from PC');
  };

  return (
    <div>
      <h1>PC Control Page</h1>
      <button onClick={handleCaptureRequest}>Capture Image from Mobile</button>
    </div>
  );
}

export default PCControlPage;
