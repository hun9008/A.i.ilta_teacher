import { useEffect, useState } from 'react';
import { useWebSocket } from './WebSocketContext';
import { MessageCircle } from 'lucide-react';

function StudyMain() {
  const { socket, sendMessage, isConnected } = useWebSocket();
  const [messages, setMessages] = useState<
    { text: string; sender: 'user' | 'bot' }[]
  >([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatVisible, setIsChatVisible] = useState(false);

  useEffect(() => {
    if (socket && isConnected) {
      console.log('WebSocket is connected');

      socket.onmessage = (event: MessageEvent) => {
        const data = event.data;

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

  // 채팅창 보이기/숨기기
  const toggleChatVisibility = () => {
    console.log('Toggling chat visibility');
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
