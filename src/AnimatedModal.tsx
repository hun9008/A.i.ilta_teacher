import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, BookOpen, User } from 'lucide-react';
import { useWebSocket } from './WebSocketContext';
import { handleTTS, TTSAudioPlayer } from './TTS';
import logo from './assets/logo.svg';

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFloe: number;
  selectedProblem: string;
  selectedConcept: string;
  // selectedHandOcr: string;
  chatOnly?: boolean;
  onSolve: () => void;
  enableTTS: boolean;
  onProblemIndexChange: (problemIndex: number) => void;
}

const chatSocketUrl = import.meta.env.VITE_CHAT_SOCKET_URL;
const u_id = localStorage.getItem('u_id');

let globalMessages: { text: string; sender: 'user' | 'bot' }[] = [];

const AnimatedModal: React.FC<AnimatedModalProps> = ({
  isOpen,
  //onClose,
  selectedFloe,
  selectedProblem,
  selectedConcept,
  chatOnly = false,
  onSolve,
  enableTTS,
  onProblemIndexChange,
}) => {
  const { getSocket, sendMessage, connectWebSocket, isConnected } =
    useWebSocket();
  const [messages, setMessages] = useState(globalMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [socketReady, setSocketReady] = useState(false);
  const [gradeInfo, setGradeInfo] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [cleanedHandOcrs, setCleanedHandOcrs] = useState<string>('');
  const [lastValidHandOcr, setLastValidHandOcr] = useState<string>('');
  const [solvedProblems, setSolvedProblems] = useState<Set<number>>(new Set());

  /* 채팅 아래로 스크롤*/
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

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

    if (isOpen) {
      let socket = getSocket(chatSocketUrl);

      if (!isConnected(chatSocketUrl)) {
        connectWebSocket(chatSocketUrl);
        socket = getSocket(chatSocketUrl); // 재연결 후 소켓 다시 가져오기
      }

      if (socket && socket.readyState === WebSocket.OPEN) {
        setSocketReady(true);
      }

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

          if (data.startsWith('status :')) {
            const statusMatch = data.match(/status\s*:\s*(\w+)/);
            const handOcrMatch = data.match(/hand_ocr\s*:\s*(.*?)(?:\/\/|$)/);
            const problemNumMatch = data.match(/problem_num\s*:\s*(\d+)/);
            if (handOcrMatch) {
              const newHandOcr = handOcrMatch[1].trim();
              console.log(newHandOcr);

              if (newHandOcr.toLowerCase() !== 'not yet') {
                setLastValidHandOcr(newHandOcr);
                setCleanedHandOcrs(newHandOcr);
              } else {
                setCleanedHandOcrs(
                  lastValidHandOcr || '손글씨가 아직 인식되지 않았습니다.'
                );
              }
            }
            if (statusMatch && problemNumMatch) {
              const status = statusMatch[1].trim();
              const newProblemIndex = parseInt(problemNumMatch[1], 10);
              console.log(status, newProblemIndex);

              if (status === 'solve' && !solvedProblems.has(newProblemIndex)) {
                onSolve();
                setSolvedProblems((prev) => new Set(prev).add(newProblemIndex));
                return;
              }
            }
            if (problemNumMatch) {
              const newProblemIndex = parseInt(problemNumMatch[1], 10);
              console.log(newProblemIndex);
              onProblemIndexChange(newProblemIndex);
            }
            console.log('Processed status message:', data);
            return;
          }

          const processedText = preprocessMessage(data);
          const newMessage = { text: processedText, sender: 'bot' as const };
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages, newMessage];
            globalMessages = updatedMessages;
            return updatedMessages;
          });

          if (newMessage.sender === 'bot' && enableTTS) {
            console.log('!!newMessage: ', newMessage.text);

            // 첫 번째와 두 번째 문장 추출
            const sentences = newMessage.text.match(/[^\.!\?]+[\.!\?]*/g);
            const firstTwoSentences = sentences
              ? sentences.slice(0, 2).join(' ')
              : newMessage.text;

            const ttsAudioUrl = await handleTTS(
              firstTwoSentences.trim(),
              u_id as string
            );

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
    }
  }, [
    isOpen,
    getSocket,
    connectWebSocket,
    isConnected,
    sendMessage,
    onProblemIndexChange,
    onSolve,
    lastValidHandOcr,
    solvedProblems,
  ]);

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
        globalMessages = updatedMessages;
        return updatedMessages;
      });
      setInputMessage('');
    } else if (!socketReady) {
      console.log('WebSocket is not ready. Please check the connection.');
    }
  };

  //const handleClose = () => {onClose();};

  if (!isOpen) {
    return null;
  }

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
  const preprocessMessage = (message: string): string => {
    message = message.replace(
      /\\\((.*?)\\\)/g,
      '<span class="math inline">$1</span>'
    );
    message = message.replace(
      /\\\[(.*?)\\\]/g,
      '<span class="math display">$1</span>'
    );

    message = message.replace(
      /(\d+)\.\s+\*\*(.*?)\*\*:/g,
      '<br><strong>$1. $2:</strong>'
    );

    message = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    message = message.replace(/\*(.*?)\*/g, '<em>$1</em>');

    message = message.replace(/\n/g, '<br>');
    return message;
  };

  return (
    <AnimatePresence>
      <motion.div
        key="modal"
        className="fixed inset-x-0 top-28 flex items-start justify-end pointer-events-none"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="flex w-2/3 h-[70vh] justify-end min-w-80 pointer-events-auto ">
          {!chatOnly && (
            <motion.div
              className="min-w-[30vw] w-1/2 border-l-2 border-r-2 border-b-8 border-purple-400 border-opacity-50 bg-white bg-opacity-100 rounded-3xl p-5 overflow-hidden shadow-2xl mr-2"
              variants={centerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ type: 'spring', damping: 20 }}
            >
              <div className="h-full flex flex-col">
                <h1 className="text-2xl font-bold mb-4 text-gray-900">
                  문제 {selectedFloe}{' '}
                </h1>
                <div className="bg-gradient-to-t from-blue-50 to-purple-50 rounded-xl p-5 mb-6 flex-grow overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4 text-gray-800">
                    <p dangerouslySetInnerHTML={{ __html: cleanedProblem }} />
                  </h2>
                </div>
                <div className="bg-gray-50 p-5 rounded-xl mb-4">
                  <h1 className="text-xl font-bold mb-4 text-gray-900">
                    이 문제에 대한 정보
                  </h1>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">
                    {gradeInfo ? `${gradeInfo}학년` : '학년 정보 없음'}
                  </h3>
                  <h3 className="text-xl font-bold mb-4 text-gray-900">
                    관련 개념들
                  </h3>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">
                    {cleanedConcept}
                  </h3>
                  {/* hans: 6 */}
                  <h3 className="text-xl font-bold mb-4 text-gray-900">
                    손글씨
                  </h3>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">
                    {cleanedHandOcrs}
                  </h3>
                </div>
                <div className="flex justify-end">
                  <button
                    className="
                    px-4 py-2 bg-blue-500 text-white rounded-full
                    hover:from-blue-400 hover:to-purple-400 active:from-blue-600 active:to-purple-600
                    transition-all duration-200
                    transform hover:-translate-y-0.5 active:translate-y-0
                    flex items-center justify-center
                    border-b-8 border-blue-600 active:border-b-0
                    font-bold text-base
                  "
                    onClick={handleSolveClick}
                  >
                    <BookOpen className="inline-block mr-2" size={20} />
                    풀었음
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            className="flex flex-col min-w-[25vw] w-1/2 border-r-2 border-l-2 border-b-8 border-blue-400 border-opacity-50 bg-blue-50 bg-opacity-100 rounded-3xl p-5 overflow-hidden shadow-2xl "
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            custom={1}
            transition={{ type: 'spring', damping: 20 }}
          >
            <h1 className="text-2xl font-bold mb-6 text-gray-900 flex items-center">
              채팅
            </h1>
            <div
              ref={chatContainerRef}
              className="flex-grow overflow-y-auto mb-6 bg-white bg-opacity-90 rounded-2xl p-4 shadow-inner"
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 flex items-start ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.sender !== 'user' && (
                    <img
                      src={logo}
                      alt="m.AI Tutor"
                      className="w-8 h-8 mr-4 flex-shrink-0"
                    />
                  )}
                  <div
                    className={`max-w-3/4 p-2.5 pr-5 pl-5 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-black'
                    }`}
                  >
                    <div
                      className="break-words"
                      dangerouslySetInnerHTML={{ __html: message.text }}
                    />{' '}
                  </div>
                  {message.sender === 'user' && (
                    <User className="w-8 h-8 ml-2 text-primary-600 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
            <div
              className="flex p-1.5 bg-white rounded-full shadow-lg overflow-hidden"
              style={{ minHeight: '56px' }}
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="메시지를 입력하세요..."
                className="flex-grow pl-4 p-1.5 rounded-l-full focus:outline-none"
                style={{ minHeight: '40px' }}
              />
              <button
                onClick={handleSendMessage}
                className="round-full bg-blue-500 text-white hover:bg-blue-600"
                style={{ height: '40px' }}
              >
                <Send size={16} className="mx-4" />
              </button>
            </div>
            {/*
            <button onClick={handleClose} className="bg-gray-400">
              닫기
            </button>*/}
          </motion.div>
          {audioUrl && <TTSAudioPlayer audioUrl={audioUrl} />}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AnimatedModal;
