import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import { useWebSocket } from './WebSocketContext';
import { handleTTS, TTSAudioPlayer } from './TTS';

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFloe: number;
  selectedProblem: string;
  selectedConcept: string;
  chatOnly?: boolean;
  onSolve: () => void;
  enableTTS: boolean;
}

const chatSocketUrl = import.meta.env.VITE_CHAT_SOCKET_URL;
const u_id = localStorage.getItem('u_id');

let globalMessages: { text: string; sender: 'user' | 'bot' }[] = [];

const AnimatedModal: React.FC<AnimatedModalProps> = ({
  isOpen,
  onClose,
  selectedFloe,
  selectedProblem,
  selectedConcept,
  chatOnly = false,
  onSolve,
  enableTTS,
}) => {
  const { getSocket, sendMessage, connectWebSocket, isConnected } =
    useWebSocket();
  const [messages, setMessages] = useState(globalMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [socketReady, setSocketReady] = useState(false);
  const [gradeInfo, setGradeInfo] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleSolveClick = () => {
    onSolve(); // Call the onSolve function
  };

  useEffect(() => {
    const birthday = localStorage.getItem('birthday');
    if (birthday) {
      const birthYear = new Date(birthday).getFullYear();
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;

      if (age === 14) setGradeInfo('중등 수학 1');
      else if (age === 15) setGradeInfo('중등 수학 2');
      else if (age === 16) setGradeInfo('중등 수학 3');
      else setGradeInfo('');
    }
    /* 채팅 오류로 인한 주석처리
    if (!isConnected(chatSocketUrl)) {
      connectWebSocket(chatSocketUrl);
    }
    const socket = getSocket(chatSocketUrl);
    if (socket) {
      socket.onopen = () => {
        console.log('WebSocket connection opened');
        setSocketReady(true);
        sendMessage(chatSocketUrl, {
          u_id: u_id,
          status: 'open',
          text: 'hi',
        });
      };
      socket.onmessage = async (event: MessageEvent) => {
        const data = event.data;
        console.log('Received WebSocket message:', data);

        // Ignore messages that start with "status:"
        if (data.startsWith('status :')) {
          console.log('Ignoring status message:', data);
          return;
        }

        const newMessage = { text: data, sender: 'bot' as const };
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages, newMessage];
          globalMessages = updatedMessages; // Update global state
          return updatedMessages;
        });

        if (newMessage.sender === 'bot' && enableTTS) {
          const ttsAudioUrl = await handleTTS(newMessage.text, u_id as string);
          if (ttsAudioUrl) {
            setAudioUrl(ttsAudioUrl);
          }
        }
      };
    }
    return () => {
      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
      }
    };
    */
  }, [getSocket, connectWebSocket, isConnected, sendMessage]);

  const handleSendMessage = () => {
    if (inputMessage.trim() && socketReady) {
      const message = {
        u_id: u_id,
        status: 'chat',
        text: inputMessage,
      };

      sendMessage(chatSocketUrl, message);

      const newMessage = { text: inputMessage, sender: 'user' as const };
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, newMessage];
        globalMessages = updatedMessages; // Update global state
        return updatedMessages;
      });
      setInputMessage('');
    }
  };

  const handleClose = () => {onClose();};

  if (!isOpen) {return null;}

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const panelVariants = {
    hidden: (custom: number) => ({ x: `${custom * 100}%` }),
    visible: { x: 0 },
    exit: (custom: number) => ({ x: `${custom * 100}%` }),
  };

  const centerVariants = {
    hidden: { y: '100%' },
    visible: { y: 0 },
    exit: { y: '100%' },
  };

  const cleanText = (text: string): string => {
    text = text.replace(/^\*\d+\*\s*/, '');
    text = text.split(/①|②|③|④|⑤/)[0];
    text = text.replace(/\\n/g, '<br />');
    text = text.replace(/[*{}]/g, '').replace(/\s+/g, ' ').trim();
    return text;
  };

  const cleanedProblem = cleanText(selectedProblem);
  const cleanedConcept = cleanText(selectedConcept);

  return (
    <AnimatePresence>
      <motion.div
        key="modal"
        className="fixed inset-0 flex items-center justify-end pointer-events-none"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="flex h-[66vh] w-fit max-w-8xl min-w-80 pointer-events-auto">
          {!chatOnly && (
            <motion.div
              className="w-max bg-white rounded-r-3xl p-5 mr-2 drop-shadow-xl"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              custom={-1}
              transition={{ type: 'spring', damping: 20 }}
            >
              <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">이 문제에 대한 정보</h1>
                <h3 className="text-lg font-semibold mb-4">
                  {gradeInfo ? `${gradeInfo}학년` : '학년 정보 없음'}
                </h3>
                <h3 className="text-2xl font-bold mb-4">관련 개념들</h3>
                <h3 className="text-lg font-semibold mb-4">{cleanedConcept}</h3>
              </div>
            </motion.div>
          )}
        </div>
        <div className="w-1/3 pointer-events-none" />
        <div className="flex w-fit h-[66vh] max-w-8xl justify-end min-w-80 pointer-events-auto">
          {!chatOnly && (
            <motion.div
              className="min-w-[25vw] w-1/2 bg-white rounded-3xl p-5 drop-shadow-xl"
              variants={centerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ type: 'spring', damping: 20 }}
            >
              <div className="p-6 flex-col h-full">
                <div className="bg-gray-100 rounded-lg p-5 pb-20 mb-10">
                  <h1 className="text-2xl font-bold mb-4">
                    문제 {selectedFloe}{' '}
                  </h1>
                  <h2 className="text-xl font-bold mb-4">
                    <p dangerouslySetInnerHTML={{ __html: cleanedProblem }} />
                  </h2>
                </div>
                <div className="flex justify-end">
                  <button
                    className="px-3 py-1 bg-primary-400 text-white rounded-2xl hover:bg-primary-500"
                    onClick={handleSolveClick}
                  >
                    풀었음
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            className="min-w-[25vw] w-1/2 bg-blue-100 rounded-l-3xl p-5 ml-2 flex flex-col drop-shadow-xl"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            custom={1}
            transition={{ type: 'spring', damping: 20 }}
          >
            <h1 className="text-2xl font-bold mb-4">채팅</h1>
            {/*
            <button onClick={handleClose} className="bg-gray-400">
              닫기
            </button>*/}
            <div className="flex-grow overflow-y-auto mb-4 bg-white rounded-lg p-3">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-2 p-2.5 rounded ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white self-end'
                      : 'bg-gray-200 text-black self-start'
                  }`}
                >
                  <span className="font-bold">
                    {message.sender === 'user' ? '학생: ' : 'm.AI 튜터: '}
                  </span>
                  {message.text}
                </div>
              ))}
            </div>
            <div className="flex p-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="메시지를 입력하세요..."
                className="flex-grow p-2 rounded-l-lg border-2 border-gray-300 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
            {audioUrl && <TTSAudioPlayer audioUrl={audioUrl} />}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AnimatedModal;
