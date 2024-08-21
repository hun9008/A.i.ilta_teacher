// import React, { useEffect, useState, useCallback, useRef } from 'react';
// import { Canvas } from '@react-three/fiber';
// import { PerspectiveCamera, Grid } from '@react-three/drei';
// import * as THREE from 'three';
// import Penguin from './3D/Penguin';
// import IceFloe from './3D/IceFloe';
// import CameraController from './3D/CameraController';
// import { AnimatePresence } from 'framer-motion';
// import AnimatedModal from './AnimatedModal';
// import logo from './assets/logo.svg';
// import { LogOut, User } from 'lucide-react';
// import BlinkingRec from './3D/BlinkingRec';
// import DebugInfo from './3D/DebugInfo';
// import Axes from './3D/Axes';
// import { useWebSocket } from './WebSocketContext';

// function Game() {
//   const [selectedProblem, setSelectedProblem] = useState<string>('');
//   const [selectedConcept, setSelectedConcept] = useState<string>('');
//   const { ocrResponse } = useWebSocket();
//   interface OcrResponse {
//     ocrs: string;
//     concepts: string[];
//   }

//   const parseOcrProblems = (ocrs: string) => {
//     ocrs = JSON.stringify(ocrs);
//     const problems = ocrs.split(/\*([0-9]+)\*/).slice(1);
//     const parsedProblems: { [key: number]: string } = {};

//     for (let i = 0; i < problems.length; i += 2) {
//       const problemNumber = parseInt(problems[i], 10);
//       parsedProblems[problemNumber] = problems[i + 1].trim();
//     }

//     return parsedProblems;
//   };

//   let problemTexts: { [key: number]: string } = {};
//   let concepts: { [key: number]: string } = {};

//   if (
//     ocrResponse &&
//     typeof ocrResponse === 'object' &&
//     'ocrs' in ocrResponse &&
//     'concepts' in ocrResponse
//   ) {
//     problemTexts = parseOcrProblems((ocrResponse as OcrResponse).ocrs);

//     concepts = (ocrResponse as OcrResponse).concepts.reduce(
//       (acc: { [key: number]: string }, concept, index) => {
//         acc[index + 1] = concept; // 문제 번호는 1부터 시작하므로 index + 1 사용
//         return acc;
//       },
//       {}
//     );
//   }

//   const [penguinPosition, setPenguinPosition] = useState<THREE.Vector3>(
//     new THREE.Vector3(0, 0.5, 0)
//   );
//   const [showModal, setShowModal] = useState<boolean>(false);
//   const [selectedFloe, setSelectedFloe] = useState<number>(0);
//   const penguinTargetPosition = useRef<THREE.Vector3>(
//     new THREE.Vector3(0, 0.5, 0)
//   );
//   const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false);
//   const [iceCount, setIceCount] = useState<number>(12);
//   const [icePositions, setIcePositions] = useState<[number, number, number][]>(
//     []
//   );

//   const [studyTime, setStudyTime] = useState<{
//     hours: number;
//     minutes: number;
//   }>(() => {
//     const savedTime = parseInt(localStorage.getItem('studyTime') || '0');
//     return { hours: Math.floor(savedTime / 60), minutes: savedTime % 60 };
//   });
//   const [breakTime, setBreakTime] = useState<{
//     hours: number;
//     minutes: number;
//   }>(() => {
//     const savedTime = parseInt(localStorage.getItem('breakTime') || '0');
//     return { hours: Math.floor(savedTime / 60), minutes: savedTime % 60 };
//   });
//   const [isStudyRunning, setIsStudyRunning] = useState(false);
//   const [isBreakRunning, setIsBreakRunning] = useState(false);

//   useEffect(() => {
//     generateCircularIcePositions(iceCount);
//   }, [iceCount]);

//   useEffect(() => {
//     let timer: NodeJS.Timeout | null = null;

//     const decreaseTime = (
//       setTime: React.Dispatch<
//         React.SetStateAction<{ hours: number; minutes: number }>
//       >
//     ) => {
//       setTime((prev) => {
//         if (prev.minutes > 0) {
//           return { ...prev, minutes: prev.minutes - 1 };
//         } else if (prev.hours > 0) {
//           return { hours: prev.hours - 1, minutes: 59 };
//         } else {
//           return prev; // Time is up
//         }
//       });
//     };

//     if (isStudyRunning) {
//       timer = setInterval(() => decreaseTime(setStudyTime), 60000);
//     } else if (isBreakRunning) {
//       timer = setInterval(() => decreaseTime(setBreakTime), 60000);
//     }

//     return () => {
//       if (timer) clearInterval(timer);
//     };
//   }, [isStudyRunning, isBreakRunning]);

//   const handleStudyStart = useCallback(() => {
//     setIsStudyRunning(true);
//     setIsBreakRunning(false);
//   }, []);

//   const handleStudyStop = useCallback(() => {
//     setIsStudyRunning(false);
//   }, []);

//   const handleBreakStart = useCallback(() => {
//     setIsBreakRunning(true);
//     setIsStudyRunning(false);
//   }, []);

//   const handleBreakStop = useCallback(() => {
//     setIsBreakRunning(false);
//   }, []);

//   const generateCircularIcePositions = (count: number) => {
//     const positions: [number, number, number][] = [];
//     const goldenAngle = Math.PI * (3 - Math.sqrt(5));
//     const maxRadius = Math.sqrt(count) * 0.5;

//     for (let i = 0; i < count; i++) {
//       const t = i / count;
//       const radius = maxRadius * Math.sqrt(t);
//       const theta = i * goldenAngle;

//       const x = radius * Math.cos(theta);
//       const z = radius * Math.sin(theta);

//       positions.push([x, 0, z]);
//     }

//     setIcePositions(positions);
//   };

//   const handleFloeClick = useCallback(
//     (index: number) => {
//       const newPosition = new THREE.Vector3(...icePositions[index]);
//       newPosition.y = 0.5;
//       if (penguinPosition.equals(newPosition)) {
//         setSelectedFloe(index);
//         setSelectedProblem(problemTexts[index + 1] || '');
//         setSelectedConcept(concepts[index + 1] || 'No concept available');
//         setShowModal(true);
//       } else {
//         penguinTargetPosition.current = newPosition;
//       }
//     },
//     [icePositions, penguinPosition, problemTexts, concepts]
//   );

//   return (
//     <div className="w-screen h-screen bg-gradient-to-b from-blue-100 to-blue-200 relative">
//       <Canvas className="w-full h-full">
//         <PerspectiveCamera makeDefault position={[-2, 8, 8]} />
//         <CameraController
//           target={penguinPosition}
//           offset={new THREE.Vector3(-2, 6, 6)}
//           smoothness={0.1}
//         />
//         <ambientLight intensity={1} />
//         <pointLight position={[10, 10, 10]} />
//         <fog attach="fog" args={['#b9d5ff', 0, 20]} />
//         {icePositions.map((position, index) => (
//           <IceFloe
//             key={index}
//             position={position}
//             onClick={() => handleFloeClick(index)}
//           />
//         ))}
//         <Penguin
//           position={penguinPosition.toArray()}
//           targetPosition={penguinTargetPosition}
//           setPenguinPosition={setPenguinPosition}
//         />
//         {showDebugInfo && <Grid args={[20, 20]} />}
//         {showDebugInfo && <Axes length={5} />}
//         {showDebugInfo && <DebugInfo penguinPosition={penguinPosition} />}
//       </Canvas>
//       <UI
//         showDebugInfo={showDebugInfo}
//         setShowDebugInfo={setShowDebugInfo}
//         showModal={showModal}
//         setShowModal={setShowModal}
//         selectedFloe={selectedFloe}
//         iceCount={iceCount}
//         setIceCount={setIceCount}
//         studyTime={studyTime}
//         breakTime={breakTime}
//         isStudyRunning={isStudyRunning}
//         isBreakRunning={isBreakRunning}
//         onStudyStart={handleStudyStart}
//         onStudyStop={handleStudyStop}
//         onBreakStart={handleBreakStart}
//         onBreakStop={handleBreakStop}
//         selectedProblem={selectedProblem}
//         selectedConcept={selectedConcept}
//       />
//       <AnimatePresence>
//         {showModal && (
//           <AnimatedModal
//             isOpen={showModal}
//             onClose={() => setShowModal(false)}
//             selectedFloe={selectedFloe}
//             selectedProblem={selectedProblem}
//             selectedConcept={selectedConcept}
//           />
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// interface UIProps {
//   showDebugInfo: boolean;
//   setShowDebugInfo: (show: boolean) => void;
//   showModal: boolean;
//   setShowModal: (show: boolean) => void;
//   selectedFloe: number;
//   iceCount: number;
//   setIceCount: (count: number) => void;
//   studyTime: { hours: number; minutes: number };
//   breakTime: { hours: number; minutes: number };
//   isStudyRunning: boolean;
//   isBreakRunning: boolean;
//   onStudyStart: () => void;
//   onStudyStop: () => void;
//   onBreakStart: () => void;
//   onBreakStop: () => void;
//   selectedProblem: string;
//   selectedConcept: string;
// }

// const UI: React.FC<UIProps> = ({
//   showDebugInfo,
//   setShowDebugInfo,
//   showModal,
//   setShowModal,
//   selectedFloe,
//   iceCount,
//   setIceCount,
//   studyTime,
//   breakTime,
//   isStudyRunning,
//   isBreakRunning,
//   onStudyStart,
//   onStudyStop,
//   onBreakStart,
//   onBreakStop,
//   selectedProblem,
//   selectedConcept,
// }) => (
//   <>
//     <div className="absolute top-0 left-0 p-4 text-white">
//       <img src={logo} alt="Logo" className="w-10 h-10 mb-2.5" />
//     </div>
//     <div className="absolute top-4 right-4 flex items-center space-x-4">
//       <div className="border-2 border-primary-400 text-black px-4 py-2 rounded-full">
//         <BlinkingRec text="웹캠" />
//       </div>
//       <div className="border-2 border-primary-400 text-black px-4 py-2 rounded-full">
//         <BlinkingRec text="모바일캠" />
//       </div>
//       <div className="w-10 h-10 bg-primary-300 rounded-full flex items-center justify-center">
//         <User size={24} color="white" />
//       </div>
//     </div>
//     <div className="absolute bottom-4 left-4 p-4 bg-white bg-opacity-75 rounded-lg flex space-x-8">
//       <div>
//         <h2 className="text-xl font-bold">남은 공부 시간</h2>
//         <p className="text-lg">
//           {studyTime.hours.toString().padStart(2, '0')}시간{' '}
//           {studyTime.minutes.toString().padStart(2, '0')}분
//         </p>
//         <button
//           onClick={isStudyRunning ? onStudyStop : onStudyStart}
//           className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//         >
//           {isStudyRunning ? 'Stop' : 'Start'}
//         </button>
//       </div>
//       <div>
//         <h2 className="text-xl font-bold">남은 쉬는 시간</h2>
//         <p className="text-lg">
//           {breakTime.hours.toString().padStart(2, '0')}시간{' '}
//           {breakTime.minutes.toString().padStart(2, '0')}분
//         </p>
//         <button
//           onClick={isBreakRunning ? onBreakStop : onBreakStart}
//           className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
//         >
//           {isBreakRunning ? 'Stop' : 'Start'}
//         </button>
//       </div>
//     </div>
//     <div className="absolute bottom-4 right-4 flex space-x-4">
//       <input
//         type="number"
//         value={iceCount}
//         onChange={(e) => setIceCount(Math.max(1, parseInt(e.target.value)))}
//         className="p-2 bg-white text-black rounded-lg"
//         placeholder="얼음 개수"
//       />
//       <button
//         className="p-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-200"
//         onClick={() => setShowDebugInfo(!showDebugInfo)}
//       >
//         {showDebugInfo ? '디버그 정보 숨기기' : '디버그 정보 표시'}
//       </button>
//       <button
//         className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200 flex"
//         onClick={() => {
//           /* 여기에 나가기 로직 추가 */
//         }}
//       >
//         <p className="mr-2">공부 종료하기</p>
//         <LogOut size={24} />
//       </button>
//     </div>
//     {showDebugInfo && (
//       <div
//         id="debug-info"
//         className="absolute bottom-4 left-4 bg-white bg-opacity-75 p-2 rounded text-black"
//       ></div>
//     )}
//     <AnimatePresence>
//       {showModal && (
//         <AnimatedModal
//           isOpen={showModal}
//           onClose={() => setShowModal(false)}
//           selectedFloe={selectedFloe}
//           selectedProblem={selectedProblem}
//           selectedConcept={selectedConcept}
//         />
//       )}
//     </AnimatePresence>
//   </>
// );

// export default Game;

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Grid } from '@react-three/drei';
import * as THREE from 'three';
import Penguin from './3D/Penguin';
import IceFloe from './3D/IceFloe';
import CameraController from './3D/CameraController';
import { AnimatePresence } from 'framer-motion';
import AnimatedModal from './AnimatedModal';
import logo from './assets/logo.svg';
import { LogOut, User } from 'lucide-react';
import BlinkingRec from './3D/BlinkingRec';
import DebugInfo from './3D/DebugInfo';
import Axes from './3D/Axes';
import { useWebSocket } from './WebSocketContext';

function Game() {
  const [selectedProblem, setSelectedProblem] = useState<string>('');
  const [selectedConcept, setSelectedConcept] = useState<string>('');
  const { ocrResponse } = useWebSocket();
  const [showChatModal, setShowChatModal] = useState<boolean>(false);


  interface OcrResponse {
    ocrs: string;
    concepts: string[];
  }

  const parseOcrProblems = (ocrs: string) => {
    ocrs = JSON.stringify(ocrs);
    const problems = ocrs.split(/\*([0-9]+)\*/).slice(1);
    const parsedProblems: { [key: number]: string } = {};

    for (let i = 0; i < problems.length; i += 2) {
      const problemNumber = parseInt(problems[i], 10);
      parsedProblems[problemNumber] = problems[i + 1].trim();
    }

    return parsedProblems;
  };

  let problemTexts: { [key: number]: string } = {};
  let concepts: { [key: number]: string } = {};
  let iceCount = 0;

  if (
    ocrResponse &&
    typeof ocrResponse === 'object' &&
    'ocrs' in ocrResponse &&
    'concepts' in ocrResponse
  ) {
    problemTexts = parseOcrProblems((ocrResponse as OcrResponse).ocrs);

    concepts = (ocrResponse as OcrResponse).concepts.reduce(
      (acc: { [key: number]: string }, concept, index) => {
        acc[index + 1] = concept; // 문제 번호는 1부터 시작하므로 index + 1 사용
        return acc;
      },
      {}
    );

    iceCount = Object.keys(problemTexts).length; // 문제 개수에 맞게 iceCount 설정
  }

  const [penguinPosition, setPenguinPosition] = useState<THREE.Vector3>(
    new THREE.Vector3(0, 0.5, 0)
  );
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedFloe, setSelectedFloe] = useState<number>(0);
  const penguinTargetPosition = useRef<THREE.Vector3>(
    new THREE.Vector3(0, 0.5, 0)
  );
  const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false);
  const [icePositions, setIcePositions] = useState<[number, number, number][]>(
    []
  );

  const [studyTime, setStudyTime] = useState<{
    hours: number;
    minutes: number;
  }>(() => {
    const savedTime = parseInt(localStorage.getItem('studyTime') || '0');
    return { hours: Math.floor(savedTime / 60), minutes: savedTime % 60 };
  });
  const [breakTime, setBreakTime] = useState<{
    hours: number;
    minutes: number;
  }>(() => {
    const savedTime = parseInt(localStorage.getItem('breakTime') || '0');
    return { hours: Math.floor(savedTime / 60), minutes: savedTime % 60 };
  });
  const [isStudyRunning, setIsStudyRunning] = useState(false);
  const [isBreakRunning, setIsBreakRunning] = useState(false);

  useEffect(() => {
    generateCircularIcePositions(iceCount);
  }, [iceCount]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const decreaseTime = (
      setTime: React.Dispatch<
        React.SetStateAction<{ hours: number; minutes: number }>
      >
    ) => {
      setTime((prev) => {
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59 };
        } else {
          return prev; // Time is up
        }
      });
    };

    if (isStudyRunning) {
      timer = setInterval(() => decreaseTime(setStudyTime), 60000);
    } else if (isBreakRunning) {
      timer = setInterval(() => decreaseTime(setBreakTime), 60000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isStudyRunning, isBreakRunning]);

  const handleStudyStart = useCallback(() => {
    setIsStudyRunning(true);
    setIsBreakRunning(false);
  }, []);

  const handleStudyStop = useCallback(() => {
    setIsStudyRunning(false);
  }, []);

  const handleBreakStart = useCallback(() => {
    setIsBreakRunning(true);
    setIsStudyRunning(false);
  }, []);

  const handleBreakStop = useCallback(() => {
    setIsBreakRunning(false);
  }, []);

  const generateCircularIcePositions = (count: number) => {
    const positions: [number, number, number][] = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const maxRadius = Math.sqrt(count) * 0.5;

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const radius = maxRadius * Math.sqrt(t);
      const theta = i * goldenAngle;

      const x = radius * Math.cos(theta);
      const z = radius * Math.sin(theta);

      positions.push([x, 0, z]);
    }

    setIcePositions(positions);
  };

  const handleFloeClick = useCallback(
    (index: number) => {
      const newPosition = new THREE.Vector3(...icePositions[index]);
      newPosition.y = 0.5;
      if (penguinPosition.equals(newPosition)) {
        setSelectedFloe(index);
        setSelectedProblem(problemTexts[index + 1] || '');
        setSelectedConcept(concepts[index + 1] || 'No concept available');
        setShowModal(true);
      } else {
        penguinTargetPosition.current = newPosition;
      }
    },
    [icePositions, penguinPosition, problemTexts, concepts]
  );

  return (
    <div className="w-screen h-screen bg-gradient-to-b from-blue-100 to-blue-200 relative">
      <Canvas className="w-full h-full">
        <PerspectiveCamera makeDefault position={[-2, 8, 8]} />
        <CameraController
          target={penguinPosition}
          offset={new THREE.Vector3(-2, 6, 6)}
          smoothness={0.1}
        />
        <ambientLight intensity={1} />
        <pointLight position={[10, 10, 10]} />
        <fog attach="fog" args={['#b9d5ff', 0, 20]} />
        {icePositions.map((position, index) => (
          <IceFloe
            key={index}
            position={position}
            onClick={() => handleFloeClick(index)}
          />
        ))}
        <Penguin
          position={penguinPosition.toArray()}
          targetPosition={penguinTargetPosition}
          setPenguinPosition={setPenguinPosition}
        />
        {showDebugInfo && <Grid args={[20, 20]} />}
        {showDebugInfo && <Axes length={5} />}
        {showDebugInfo && <DebugInfo penguinPosition={penguinPosition} />}
      </Canvas>
      <UI
        showDebugInfo={showDebugInfo}
        setShowDebugInfo={setShowDebugInfo}
        showModal={showModal}
        setShowModal={setShowModal}
        showChatModal={showChatModal}
        setShowChatModal={setShowChatModal}
        selectedFloe={selectedFloe}
        studyTime={studyTime}
        breakTime={breakTime}
        isStudyRunning={isStudyRunning}
        isBreakRunning={isBreakRunning}
        onStudyStart={handleStudyStart}
        onStudyStop={handleStudyStop}
        onBreakStart={handleBreakStart}
        onBreakStop={handleBreakStop}
        selectedProblem={selectedProblem}
        selectedConcept={selectedConcept}
      />
      <AnimatePresence>
        {showModal && (
          <AnimatedModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            selectedFloe={selectedFloe}
            selectedProblem={selectedProblem}
            selectedConcept={selectedConcept}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showChatModal && (
          <AnimatedModal
            isOpen={showChatModal}
            onClose={() => setShowChatModal(false)}
            selectedFloe={selectedFloe}
            selectedProblem={selectedProblem}
            selectedConcept={selectedConcept}
            chatOnly={true}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

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
}

const UI: React.FC<UIProps> = ({
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
  showChatModal,
  setShowChatModal,
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
        />
      )}
    </AnimatePresence>
  </>
);

export default Game;
