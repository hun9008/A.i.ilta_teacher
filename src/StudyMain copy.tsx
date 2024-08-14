import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';

function Study() {
  const [messages, setMessages] = useState<
    { text: string; sender: 'user' | 'bot' }[]
  >([]);
  const [inputMessage, setInputMessage] = useState('');
  const [previousQuestion, setPreviousQuestion] = useState<string | null>(null);
  const [previousAnswer, setPreviousAnswer] = useState<string | null>(null);
  const [isChatVisible, setIsChatVisible] = useState(false);

  useEffect(() => {
    if (isChatVisible) {
      const fetchMessages = async () => {
        const baseUrl = import.meta.env.VITE_BASE_URL;

        try {
          const response = await fetch(`${baseUrl}/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'fetch_messages',
            }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Fetched messages:', data);
            setMessages((prevMessages) => [
              ...prevMessages,
              { text: data, sender: 'bot' },
            ]);
            setPreviousAnswer(data);
          } else {
            console.error(`Failed to fetch messages: ${response.statusText}`);
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      };

      fetchMessages();
      const intervalId = setInterval(fetchMessages, 3000);

      return () => clearInterval(intervalId);
    }
  }, [isChatVisible]);

  // 메시지를 보내는 함수
  const sendMessage = async () => {
    if (inputMessage.trim() !== '') {
      const baseUrl = import.meta.env.VITE_BASE_URL;

      // 서버로 보낼 요청 본문
      const requestBody = {
        status: 'solve_delay',
        text: `
        previousQuestion: ${previousQuestion},
        previousAnswer: ${previousAnswer},
        currentQuestion: ${inputMessage},
        `,
      };

      try {
        const response = await fetch(`${baseUrl}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Sent message:', inputMessage);
          setMessages((prevMessages) => [
            ...prevMessages,
            { text: inputMessage, sender: 'user' },
            { text: data, sender: 'bot' },
          ]);
          setPreviousQuestion(inputMessage);
          setPreviousAnswer(data);
          setInputMessage('');
        } else {
          console.error(`Failed to send message: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
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
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-grow p-1 rounded border border-gray-300"
            />
            <button
              onClick={sendMessage}
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

export default Study;
