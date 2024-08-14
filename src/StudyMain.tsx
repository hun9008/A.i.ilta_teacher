import { useEffect, useState } from 'react';
import { User, Settings, MessageCircle } from 'lucide-react';

import logo from './assets/logo.svg';

function StudyMain() {
  const [messages, setMessages] = useState<
    { text: string; sender: 'user' | 'bot' }[]
  >([]);
  const [inputMessage, setInputMessage] = useState('');
  const [previousQuestion, setPreviousQuestion] = useState<string | null>(null);
  const [previousAnswer, setPreviousAnswer] = useState<string | null>(null);
  const [isChatVisible, setIsChatVisible] = useState(false);

  // const [timer1, setTimer1] = useState(0);
  // const [timer2, setTimer2] = useState(0);
  const [timer1, setTimer1] = useState(90);
  const [timer2, setTimer2] = useState(45);
  const [isRunning1, setIsRunning1] = useState(false);
  const [isRunning2, setIsRunning2] = useState(false);

  // useEffect(() => {
  //   const fetchTimerValues = async () => {
  //     const baseUrl = import.meta.env.VITE_BASE_URL;

  //     try {
  //       const response = await fetch(`${baseUrl}/get-timers`, {
  //         method: 'GET',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //       });

  //       if (response.ok) {
  //         const data = await response.json();
  //         setTimer1(data.timer1);
  //         setTimer2(data.timer2);
  //       } else {
  //         console.error(`Failed to fetch timer values: ${response.statusText}`);
  //       }
  //     } catch (error) {
  //       console.error('Error fetching timer values:', error);
  //     }
  //   };

  //   fetchTimerValues();
  // }, []);

  // 첫 번째 타이머 제어
  useEffect(() => {
    let intervalId: number;
    if (isRunning1) {
      intervalId = window.setInterval(() => {
        setTimer1((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
      }, 60000); // 분 단위로 감소
    }
    return () => clearInterval(intervalId);
  }, [isRunning1]);

  // 두 번째 타이머 제어
  useEffect(() => {
    let intervalId: number;
    if (isRunning2) {
      intervalId = window.setInterval(() => {
        setTimer2((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
      }, 60000); // 분 단위로 감소
    }
    return () => clearInterval(intervalId);
  }, [isRunning2]);

  // 시간:분 포맷 함수
  const formatTime = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const formattedHours = hours >= 0 ? `${hours}:` : '';
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

    return `${formattedHours}${formattedMinutes}`;
  };

  // 메시지를 가져오는 함수
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
              status: 'fetch_messages', // 서버가 필요로 하는 action이 있다면 여기서 전달
            }),
          });

          if (response.ok) {
            const data = await response.json(); // 응답을 JSON으로 처리
            console.log('Fetched messages:', data); // 디버깅용 로그
            setMessages((prevMessages) => [
              ...prevMessages,
              { text: data, sender: 'bot' },
            ]);
            setPreviousAnswer(data); // 가장 마지막 답변을 저장
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
          const data = await response.json(); // 응답을 JSON으로 처리
          console.log('Sent message:', inputMessage); // 디버깅용 로그
          setMessages((prevMessages) => [
            ...prevMessages,
            { text: inputMessage, sender: 'user' }, // 보낸 메시지를 user로 표시
            { text: data, sender: 'bot' }, // 받은 메시지를 bot으로 표시
          ]);
          setPreviousQuestion(inputMessage); // 현재 질문을 이전 질문으로 설정
          setPreviousAnswer(data); // 서버에서 받은 답변을 이전 답변으로 설정
          setInputMessage(''); // 입력 필드를 비움
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
      <div className="flex flex-col items-center w-20 bg-gray-100">
        <img src={logo} alt="Logo" className="w-10 h-10 mb-2.5" />
        <User className="mb-6" />
        <Settings className="mb-6" />
        <MessageCircle
          onClick={toggleChatVisibility}
          className="cursor-pointer"
        />
      </div>
      <div className="flex mb-2.5">
        <div className="mr-5">
          <h3>
            오늘 공부 목표 시간
            <h4>{formatTime(timer1)}</h4>
          </h3>
          <button
            onClick={() => setIsRunning1(!isRunning1)}
            className={`mr-2.5 px-2.5 py-1 rounded ${
              isRunning1 ? 'bg-red-600' : 'bg-green-600'
            } text-white border-none cursor-pointer`}
          >
            {isRunning1 ? 'Stop' : 'Start'}
          </button>
        </div>
        <div>
          <h3>
            공부 중 쉬는 시간
            <h4>{formatTime(timer2)}</h4>
          </h3>
          <button
            onClick={() => setIsRunning2(!isRunning2)}
            className={`mr-2.5 px-2.5 py-1 rounded ${
              isRunning2 ? 'bg-red-600' : 'bg-green-600'
            } text-white border-none cursor-pointer`}
          >
            {isRunning2 ? 'Stop' : 'Start'}
          </button>
        </div>
      </div>
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

export default StudyMain;
