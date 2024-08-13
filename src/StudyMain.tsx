import { useEffect, useState } from 'react';

import logo from './assets/logo.svg';
import userIcon from './assets/user_icons.png';
import settingsIcon from './assets/setting_icons.png';
import chatIcon from './assets/chat_icons.png';

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
      intervalId = setInterval(() => {
        setTimer1((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
      }, 60000); // 분 단위로 감소
    }
    return () => clearInterval(intervalId);
  }, [isRunning1]);

  // 두 번째 타이머 제어
  useEffect(() => {
    let intervalId: number;
    if (isRunning2) {
      intervalId = setInterval(() => {
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
    <div style={{ display: 'flex', height: '100vh' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '80px',
          backgroundColor: '#f0f0f0',
        }}
      >
        <img
          src={logo}
          alt="Logo"
          style={{ width: '40px', height: '40px', marginBottom: '10px' }}
        />
        <img
          src={userIcon}
          alt="User Icon"
          style={{
            width: '40px',
            height: '40px',
            marginBottom: '15px',
            cursor: 'pointer',
          }}
        />
        <img
          src={settingsIcon}
          alt="Settings Icon"
          style={{
            width: '30px',
            height: '30px',
            marginBottom: '15px',
            cursor: 'pointer',
          }}
        />
        <img
          src={chatIcon}
          alt="Chat Icon"
          style={{ width: '30px', height: '30px', cursor: 'pointer' }}
          onClick={toggleChatVisibility}
        />
      </div>
      <div style={{ display: 'flex', marginBottom: '10px' }}>
        <div style={{ marginRight: '20px' }}>
          <h3>
            {' '}
            오늘 공부 목표 시간
            <h4>{formatTime(timer1)}</h4>
          </h3>
          <button
            onClick={() => setIsRunning1(!isRunning1)}
            style={{
              marginRight: '10px',
              padding: '5px 10px',
              borderRadius: '5px',
              backgroundColor: isRunning1 ? '#dc3545' : '#28a745',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {isRunning1 ? 'Stop' : 'Start'}
          </button>
        </div>
        <div>
          <h3>
            {' '}
            공부 중 쉬는 시간
            <h4>{formatTime(timer2)}</h4>
          </h3>{' '}
          <button
            onClick={() => setIsRunning2(!isRunning2)}
            style={{
              marginRight: '10px',
              padding: '5px 10px',
              borderRadius: '5px',
              backgroundColor: isRunning2 ? '#dc3545' : '#28a745',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {isRunning2 ? 'Stop' : 'Start'}
          </button>
        </div>
      </div>
      {isChatVisible && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '300px',
            backgroundColor: '#f9f9f9',
            padding: '10px',
            borderLeft: '1px solid #ddd',
            marginLeft: 'auto',
          }}
        >
          <div style={{ overflowY: 'auto', flexGrow: 1, marginBottom: '10px' }}>
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  margin: '5px 0',
                  padding: '5px 10px',
                  backgroundColor:
                    message.sender === 'user' ? '#007bff' : '#fff', // 사용자 메시지는 파란 배경
                  color: message.sender === 'user' ? '#fff' : '#000', // 사용자 메시지는 흰 글씨
                  borderRadius: '5px',
                  alignSelf:
                    message.sender === 'user' ? 'flex-end' : 'flex-start', // 정렬 방향 다르게
                }}
              >
                {message.text}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex' }}>
            <input
              type="text"
              value={inputMessage} // 상태가 입력 필드에 제대로 바인딩되었는지 확인
              onChange={(e) => setInputMessage(e.target.value)} // 입력 필드를 업데이트하는 함수 확인
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              style={{
                flexGrow: 1,
                padding: '5px',
                borderRadius: '5px',
                border: '1px solid #ddd',
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                marginLeft: '10px',
                padding: '5px 10px',
                borderRadius: '5px',
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
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
