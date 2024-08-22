import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { LogOut, User } from 'lucide-react';
import BlinkingRec from './3D/BlinkingRec';
import AnimatedModal from './AnimatedModal';
import logo from './assets/logo.svg';

interface UIProps {
  showDebugInfo: boolean;
  setShowDebugInfo: (show: boolean) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  selectedFloe: number;
  studyTime: { hours: number; minutes: number };
  breakTime: { hours: number; minutes: number };
  isStudyRunning: boolean;
  isBreakRunning: boolean;
  onStudyStart: () => void;
  onStudyStop: () => void;
  onBreakStart: () => void;
  onBreakStop: () => void;
  selectedProblem: string;
  selectedConcept: string;
  showChatModal: boolean;
  setShowChatModal: (show: boolean) => void;
  onSolve: () => void;
}

const GameUI: React.FC<UIProps> = ({
  showDebugInfo,
  setShowDebugInfo,
  showModal,
  setShowModal,
  selectedFloe,
  studyTime,
  breakTime,
  isStudyRunning,
  isBreakRunning,
  onStudyStart,
  onStudyStop,
  onBreakStart,
  onBreakStop,
  selectedProblem,
  selectedConcept,
  setShowChatModal,
  onSolve,
}) => (
  <>
    <div className="absolute top-0 left-0 p-4 text-white">
      <img src={logo} alt="Logo" className="w-10 h-10 mb-2.5" />
    </div>
    <div className="absolute top-4 right-4 flex items-center space-x-4">
      <div className="border-2 border-primary-400 text-black px-4 py-2 rounded-full">
        <BlinkingRec text="웹캠" />
      </div>
      <div className="border-2 border-primary-400 text-black px-4 py-2 rounded-full">
        <BlinkingRec text="모바일캠" />
      </div>
      <div className="w-10 h-10 bg-primary-300 rounded-full flex items-center justify-center">
        <User size={24} color="white" />
      </div>
    </div>
    <div className="absolute bottom-4 left-4 p-4 bg-white bg-opacity-75 rounded-lg flex space-x-8">
      <div>
        <h2 className="text-xl font-bold">남은 공부 시간</h2>
        <p className="text-lg">
          {studyTime.hours.toString().padStart(2, '0')}시간{' '}
          {studyTime.minutes.toString().padStart(2, '0')}분
        </p>
        <button
          onClick={isStudyRunning ? onStudyStop : onStudyStart}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {isStudyRunning ? 'Stop' : 'Start'}
        </button>
      </div>
      <div>
        <h2 className="text-xl font-bold">남은 쉬는 시간</h2>
        <p className="text-lg">
          {breakTime.hours.toString().padStart(2, '0')}시간{' '}
          {breakTime.minutes.toString().padStart(2, '0')}분
        </p>
        <button
          onClick={isBreakRunning ? onBreakStop : onBreakStart}
          className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          {isBreakRunning ? 'Stop' : 'Start'}
        </button>
      </div>
    </div>
    <div className="absolute bottom-4 right-4 flex space-x-4">
      <button
        className="p-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-200"
        onClick={() => setShowDebugInfo(!showDebugInfo)}
      >
        {showDebugInfo ? '디버그 정보 숨기기' : '디버그 정보 표시'}
      </button>
      <button
        className="p-4 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors duration-200 flex items-center"
        onClick={() => setShowChatModal(true)}
      >
        <span>채팅</span>
      </button>
      <button
        className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200 flex"
        onClick={() => {
          /* 여기에 나가기 로직 추가 */
        }}
      >
        <p className="mr-2">공부 종료하기</p>
        <LogOut size={24} />
      </button>
    </div>
    {showDebugInfo && (
      <div
        id="debug-info"
        className="absolute bottom-4 left-4 bg-white bg-opacity-75 p-2 rounded text-black"
      ></div>
    )}
    <AnimatePresence>
      {showModal && (
        <AnimatedModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          selectedFloe={selectedFloe}
          selectedProblem={selectedProblem}
          selectedConcept={selectedConcept}
          onSolve={onSolve}
        />
      )}
    </AnimatePresence>
  </>
);

export default GameUI;
