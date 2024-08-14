// import { useEffect, useState } from 'react';
// import { useLocation } from 'react-router-dom';
// import logo from './assets/logo.svg';
// import userIcon from './assets/user_icons.png';
// import settingsIcon from './assets/setting_icons.png';
// import chatIcon from './assets/chat_icons.png';

// // interface StudyMainProps {
// //   socket: WebSocket;
// // }

// function StudyMain() {
//   const location = useLocation();
//   const socket = location.state?.socket;

//   const [messages, setMessages] = useState<
//     { text: string; sender: 'user' | 'bot' }[]
//   >([]);
//   const [inputMessage, setInputMessage] = useState('');
//   const [isChatVisible, setIsChatVisible] = useState(false);
//   const [timer1, setTimer1] = useState(90);
//   const [timer2, setTimer2] = useState(45);
//   const [isRunning1, setIsRunning1] = useState(false);
//   const [isRunning2, setIsRunning2] = useState(false);

//   useEffect(() => {
//     let intervalId: number;
//     if (isRunning1) {
//       intervalId = window.setInterval(() => {
//         setTimer1((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
//       }, 60000); // 분 단위로 감소
//     }
//     return () => clearInterval(intervalId);
//   }, [isRunning1]);

//   useEffect(() => {
//     let intervalId: number;
//     if (isRunning2) {
//       intervalId = window.setInterval(() => {
//         setTimer2((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
//       }, 60000); // 분 단위로 감소
//     }
//     return () => clearInterval(intervalId);
//   }, [isRunning2]);

//   const formatTime = (totalMinutes: number) => {
//     const hours = Math.floor(totalMinutes / 60);
//     const minutes = totalMinutes % 60;

//     const formattedHours = hours >= 0 ? `${hours}:` : '';
//     const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

//     return `${formattedHours}${formattedMinutes}`;
//   };

//   // 웹소켓을 통한 메시지 수신 처리
//   useEffect(() => {
//     if (socket) {
//       socket.onmessage = (event: MessageEvent) => {
//         const data = event.data;
//         setMessages((prevMessages) => [
//           ...prevMessages,
//           { text: data, sender: 'bot' },
//         ]);
//       };

//       socket.onerror = (error: Event) => {
//         console.error('WebSocket error:', error);
//       };

//       socket.onclose = (event: CloseEvent) => {
//         console.warn('WebSocket connection closed:', event);
//       };
//     }

//     return () => {
//       if (socket) {
//         socket.close();
//       }
//     };
//   }, [socket]);

//   const sendMessage = () => {
//     if (!socket) {
//       console.error('Socket is not initialized');
//       return;
//     }

//     if (inputMessage.trim() !== '' && socket.readyState === WebSocket.OPEN) {
//       const message = {
//         u_id: localStorage.getItem('u_id'),
//         status: 'chat',
//         text: inputMessage,
//       };

//       socket.send(JSON.stringify(message));

//       setMessages((prevMessages) => [
//         ...prevMessages,
//         { text: inputMessage, sender: 'user' },
//       ]);

//       setInputMessage('');
//     } else {
//       console.error('WebSocket is not open:', socket.readyState);
//     }
//   };

//   const toggleChatVisibility = () => {
//     setIsChatVisible((prevState) => !prevState);
//   };
//   return (
//     <div style={{ display: 'flex', height: '100vh' }}>
//       <div
//         style={{
//           display: 'flex',
//           flexDirection: 'column',
//           alignItems: 'center',
//           width: '80px',
//           backgroundColor: '#f0f0f0',
//         }}
//       >
//         <img
//           src={logo}
//           alt="Logo"
//           style={{ width: '40px', height: '40px', marginBottom: '10px' }}
//         />
//         <img
//           src={userIcon}
//           alt="User Icon"
//           style={{
//             width: '40px',
//             height: '40px',
//             marginBottom: '15px',
//             cursor: 'pointer',
//           }}
//         />
//         <img
//           src={settingsIcon}
//           alt="Settings Icon"
//           style={{
//             width: '30px',
//             height: '30px',
//             marginBottom: '15px',
//             cursor: 'pointer',
//           }}
//         />
//         <img
//           src={chatIcon}
//           alt="Chat Icon"
//           style={{ width: '30px', height: '30px', cursor: 'pointer' }}
//           onClick={toggleChatVisibility}
//         />
//       </div>
//       <div style={{ display: 'flex', marginBottom: '10px' }}>
//         <div style={{ marginRight: '20px' }}>
//           <h3> 오늘 공부 목표 시간</h3>
//           <h4>{formatTime(timer1)}</h4>
//           <button
//             onClick={() => setIsRunning1(!isRunning1)}
//             style={{
//               marginRight: '10px',
//               padding: '5px 10px',
//               borderRadius: '5px',
//               backgroundColor: isRunning1 ? '#dc3545' : '#28a745',
//               color: '#fff',
//               border: 'none',
//               cursor: 'pointer',
//             }}
//           >
//             {isRunning1 ? 'Stop' : 'Start'}
//           </button>
//         </div>
//         <div>
//           <h3> 공부 중 쉬는 시간</h3>
//           <h4>{formatTime(timer2)}</h4>
//           <button
//             onClick={() => setIsRunning2(!isRunning2)}
//             style={{
//               marginRight: '10px',
//               padding: '5px 10px',
//               borderRadius: '5px',
//               backgroundColor: isRunning2 ? '#dc3545' : '#28a745',
//               color: '#fff',
//               border: 'none',
//               cursor: 'pointer',
//             }}
//           >
//             {isRunning2 ? 'Stop' : 'Start'}
//           </button>
//         </div>
//       </div>

//       {isChatVisible && (
//         <div
//           style={{
//             display: 'flex',
//             flexDirection: 'column',
//             justifyContent: 'space-between',
//             width: '300px',
//             backgroundColor: '#f9f9f9',
//             padding: '10px',
//             borderLeft: '1px solid #ddd',
//             marginLeft: 'auto',
//           }}
//         >
//           <div style={{ overflowY: 'auto', flexGrow: 1, marginBottom: '10px' }}>
//             {messages.map((message, index) => (
//               <div
//                 key={index}
//                 style={{
//                   margin: '5px 0',
//                   padding: '5px 10px',
//                   backgroundColor:
//                     message.sender === 'user' ? '#007bff' : '#fff',
//                   color: message.sender === 'user' ? '#fff' : '#000',
//                   borderRadius: '5px',
//                   alignSelf:
//                     message.sender === 'user' ? 'flex-end' : 'flex-start',
//                 }}
//               >
//                 {message.text}
//               </div>
//             ))}
//           </div>
//           <div style={{ display: 'flex' }}>
//             <input
//               type="text"
//               value={inputMessage}
//               onChange={(e) => setInputMessage(e.target.value)}
//               onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
//               style={{
//                 flexGrow: 1,
//                 padding: '5px',
//                 borderRadius: '5px',
//                 border: '1px solid #ddd',
//               }}
//             />
//             <button
//               onClick={sendMessage}
//               style={{
//                 marginLeft: '10px',
//                 padding: '5px 10px',
//                 borderRadius: '5px',
//                 backgroundColor: '#007bff',
//                 color: '#fff',
//                 border: 'none',
//                 cursor: 'pointer',
//               }}
//             >
//               Send
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default StudyMain;
import { useEffect, useState } from 'react';
import { useWebSocket } from './WebSocketContext';

function StudyMain() {
  const { socket, sendMessage, isConnected } = useWebSocket();
  const [messages, setMessages] = useState<
    { text: string; sender: 'user' | 'bot' }[]
  >([]);
  const [inputMessage, setInputMessage] = useState('');

  useEffect(() => {
    if (socket && isConnected) {
      console.log('WebSocket is connected');

      socket.onmessage = (event: MessageEvent) => {
        const data = event.data;

        // 받은 메시지를 콘솔에 출력
        console.log('Received WebSocket message:', data);

        setMessages((prevMessages) => [
          ...prevMessages,
          { text: data, sender: 'bot' },
        ]);
      };
    }
  }, [socket, isConnected]);

  const handleSendMessage = () => {
    const u_id = localStorage.getItem('u_id');

    if (inputMessage.trim()) {
      const message = {
        u_id: u_id,
        status: 'chat',
        text: inputMessage,
      };

      console.log('u_id:', u_id);
      console.log('inputMessage:', inputMessage);
      console.log(
        'Sending WebSocket message:',
        JSON.stringify(message, null, 2)
      );

      sendMessage(message);

      setMessages((prevMessages) => [
        ...prevMessages,
        { text: inputMessage, sender: 'user' },
      ]);
      setInputMessage('');
    } else {
      console.log('Message is empty or connection is not ready.');
    }
  };

  return (
    <div>
      <div>
        {isConnected ? 'Connected to server' : 'Not connected to server'}
      </div>
      <div>
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              margin: '5px 0',
              padding: '5px 10px',
              borderRadius: '5px',
            }}
          >
            <span
              style={{
                fontWeight: message.sender === 'user' ? 'bold' : 'normal',
              }}
            >
              {message.sender === 'user' ? 'You' : 'Bot'}:
            </span>
            <span> {message.text}</span>
          </div>
        ))}
      </div>
      <input
        type="text"
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
      />
      <button onClick={handleSendMessage} disabled={!isConnected}>
        Send
      </button>
    </div>
  );
}

export default StudyMain;
