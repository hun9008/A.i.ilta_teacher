import React from 'react';
import { LogOut, User, Volume2, VolumeX } from 'lucide-react';
import BlinkingRec from './3D/BlinkingRec';
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
  onEndStudySession: () => Promise<void>;

  onSolve: () => void;
  enableTTS: boolean;
  setEnableTTS: (show: boolean) => void;
}

const GameUI: React.FC<UIProps> = ({
  showDebugInfo,
  setShowDebugInfo,
  studyTime,
  breakTime,
  isStudyRunning,
  isBreakRunning,
  onStudyStart,
  onStudyStop,
  onBreakStart,
  onBreakStop,
  setShowChatModal,
  enableTTS,
  setEnableTTS,
  onEndStudySession,
}) => (
  <>
    <div className="absolute top-4 left-4 p-2 rounded-lg font-poor-story">
      <img src={logo} alt="Logo" className="w-12 h-12 animate-pulse" />
    </div>
    <div className="absolute top-4 right-4 flex items-center space-x-4">
      <button
        onClick={() => setEnableTTS(!enableTTS)}
        className="w-12 h-12 bg-primary-300 rounded-full hover:bg-primary-200 border-none transition-colors duration-100 flex items-center justify-center"
      >
        {enableTTS ? (
          <Volume2 size={30} color="white" />
        ) : (
          <VolumeX size={30} color="white" />
        )}
      </button>
      <div className="border-2 border-primary-400 text-black px-4 py-2 rounded-full">
        <BlinkingRec text="웹캠" />
      </div>
      <div className="border-2 border-primary-400 text-black px-4 py-2 rounded-full">
        <BlinkingRec text="모바일캠" />
      </div>
      <div className="w-12 h-12 bg-primary-300 rounded-full hover:bg-primary-200 transition-colors duration-100 flex items-center justify-center">
        <User size={30} color="white" />
      </div>
    </div>
    <div className="absolute bottom-4 left-4 flex">
      <div className="p-6 bg-gray-50 bg-opacity-50 rounded-2xl flex shadow-lg backdrop-blur-sm space-x-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-indigo-600 mb-2">남은 공부 시간</h2>
          <p className="text-3xl font-bold text-indigo-800 mb-3">
            {studyTime.hours.toString().padStart(2, '0')}:{studyTime.minutes.toString().padStart(2, '0')}
          </p>
          <button
            onClick={isStudyRunning ? onStudyStop : onStudyStart}
            className="px-4 py-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-400 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-md text-sm font-bold"
          >
            {isStudyRunning ? '중지' : '시작'}
          </button>
        </div>
        <div className="w-px bg-indigo-200"></div>
        <div className="text-center ">
          <h2 className="text-xl font-bold text-teal-600 mb-2">남은 쉬는 시간</h2>
          <p className="text-3xl font-bold text-teal-800 mb-3">
            {breakTime.hours.toString().padStart(2, '0')}:{breakTime.minutes.toString().padStart(2, '0')}
          </p>
          <button
            onClick={isBreakRunning ? onBreakStop : onBreakStart}
            className="px-4 py-2 bg-teal-500 text-white rounded-full hover:bg-teal-400 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-md text-sm font-bold"
          >
            {isBreakRunning ? '중지' : '시작'}
          </button>
        </div>
      </div>
    </div>
    
    <div className="absolute bottom-4 right-4 flex space-x-4">
      
      <button onClick={() => setShowDebugInfo(!showDebugInfo)}>
        {showDebugInfo ? '디버그 정보 숨기기' : '디버그 정보 표시'}
      </button>
      {/*
      <button onClick={() => setShowChatModal(true)}>채팅</button>
      */}
      <button
        className="
          p-4 bg-rose-400 text-white rounded-full
          hover:bg-rose-300 active:bg-rose-500
          transition-all duration-200
          transform hover:-translate-y-2 active:translate-y-0
          flex items-center justify-center
          border-b-8 border-rose-500 active:border-b-0
          font-bold text-base
        "
        onClick={onEndStudySession}
      >
        <p className="mr-2">공부 그만하기</p>
        <LogOut size={24} />
      </button>
    </div>
    {showDebugInfo && (
      <div
        id="debug-info"
        className="absolute bottom-4 left-4 bg-white bg-opacity-75 p-2 rounded text-black"
      ></div>
    )}
  </>
);

export default GameUI;
