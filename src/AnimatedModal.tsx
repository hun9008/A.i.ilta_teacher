import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFloe: number;
}

const AnimatedModal: React.FC<AnimatedModalProps> = ({ isOpen, onClose, selectedFloe }) => {
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

  return (
    <AnimatePresence>
        <motion.div 
          key="modal" // key 추가
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <div className="flex w-full min-h-[66vh] h-fit max-h-[90vh] max-w-8xl"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div 
              className="w-1/4 bg-blue-100 rounded-r-3xl p-5 mr-2"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              custom={-1}
              transition={{ type: 'spring', damping: 20 }}
            >
              <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">이 문제에 대한 정보</h1>
                <h3 className="text-lg font-semibold mb-4">몇학년 몇학기</h3>
                <h3 className="text-lg font-semibold mb-4">무슨 단원</h3>
                <h3 className="text-lg font-semibold mb-4">무슨 유형</h3>
                <h3 className="text-lg font-semibold mb-4">관련 개념들</h3>
                <h3 className="text-lg font-semibold mb-4"></h3>
              </div>
            </motion.div>

            <motion.div 
              className="w-1/2 bg-white rounded-3xl p-5"
              variants={centerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ type: 'spring', damping: 20 }}
            >
              <div className="p-6 flex-col h-full">
                <div className='bg-gray-100 rounded-lg p-5 pb-20 mb-10'>
                    <h1 className='text-2xl font-bold mb-4'>문제 {selectedFloe + 1} </h1>
                    <h2 className="text-xl font-bold mb-4">"문제 OCR 텍스트 여기에 들어갑니다"</h2>
                    <p> 1.x 2.y 3.z </p>
                </div>
                <div className='bg-gray-100 rounded-lg p-5 pb-20 mb-10 flex-grow'>
                    <h1 className='text-2xl font-bold mb-4'>현재 내 풀이 </h1>
                    <h2 className="text-xl font-bold mb-4">"현재 내가 풀고있는 손글씨 ocr이 여기에 들어갑니당"</h2>
                </div>
                <div className="flex justify-end">
                <button
                    className="px-4 py-2 bg-primary-400 text-white rounded-2xl hover:bg-primary-500"
                    onClick={onClose}
                >
                    Close
                </button>
                </div>
              </div>
            </motion.div>

            <motion.div
            className="w-1/4 bg-blue-100 rounded-l-3xl p-5 ml-2 flex flex-col"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            custom={1}
            transition={{ type: 'spring', damping: 20 }}
            >
            <h1 className="text-2xl font-bold mb-4">채팅</h1>
            <div className="flex-grow overflow-y-auto mb-4 bg-white rounded-lg p-3">
                {/* 여기에 채팅 메시지들이 표시됩니다 */}
                <div className="mb-2">
                <span className="font-bold">m.AI 튜터:</span> 너 집중 안해??
                </div>
                <div className="mb-2">
                <span className="font-bold">학생:</span> 죄송해요....
                </div>
                <div className="mb-2">
                <span className="font-bold">m.AI 튜터:</span> 걱정하지 마. 천천히 함께 풀어보자
                </div>
                {/* 추가 메시지들... */}
            </div>
            <div className="flex p-3">
                <input
                type="text"
                placeholder="메시지를 입력하세요..."
                className="flex-grow p-2 rounded-l-lg border-2 border-gray-300 focus:outline-none focus:border-blue-500"
                />
                <button className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors">
                    <Send size={20} />
                </button>
            </div>
            </motion.div>
          </div>
        </motion.div>
    </AnimatePresence>
  );
};

export default AnimatedModal;
