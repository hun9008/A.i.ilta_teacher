import { useEffect, useState } from 'react';
import { useWebSocket } from './WebSocketContext';
import { MessageCircle } from 'lucide-react';

const chatSocketUrl = import.meta.env.VITE_CHAT_SOCKET_URL;

function StudyMain() {
  const { getSocket, sendMessage, connectWebSocket, isConnected } =
    useWebSocket();
  const [messages, setMessages] = useState<
    { text: string; sender: 'user' | 'bot' }[]
  >([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatVisible, setIsChatVisible] = useState(false);

  useEffect(() => {
    connectWebSocket(chatSocketUrl);

    const socket = getSocket(chatSocketUrl);
    if (socket && isConnected(chatSocketUrl)) {
      socket.onmessage = (event: MessageEvent) => {
        const data = event.data;
        console.log('Received WebSocket message:', data);
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: data, sender: 'bot' },
        ]);
      };
    }
  }, [getSocket, connectWebSocket, isConnected]);

  const handleSendMessage = () => {
    const u_id = localStorage.getItem('u_id');

    if (inputMessage.trim()) {
      const message = {
        u_id: u_id,
        status: 'chat',
        text: inputMessage,
      };

      sendMessage(chatSocketUrl, message);

      setMessages((prevMessages) => [
        ...prevMessages,
        { text: inputMessage, sender: 'user' },
      ]);
      setInputMessage('');
    }
  };

  const toggleChatVisibility = () => {
    setIsChatVisible((prevState) => !prevState);
  };

  return (
    <div className="flex h-screen">
      <MessageCircle
        onClick={toggleChatVisibility}
        className="cursor-pointer"
      />
      {isChatVisible && (
        <div className="flex flex-col justify-between w-72 bg-gray-50 p-2.5 border-l border-gray-300 ml-auto">
          <div className="overflow-y-auto flex-grow mb-2.5">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`my-1.5 p-2.5 rounded ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white self-end'
                    : 'bg-white text-black self-start'
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>
          <div className="flex">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-grow p-1 rounded border border-gray-300"
            />
            <button
              onClick={handleSendMessage}
              className="ml-2.5 px-2.5 py-1 rounded bg-blue-500 text-white border-none cursor-pointer"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudyMain;
