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

function Game() {
  const [selectedProblem, setSelectedProblem] = useState<string>('');

  const ocrResponse = {
    concepts:
      '5.  Problem solving keywords:\n- Rational function inequality\n- Algebraic manipulation\n- Solution of inequalities\n- Linear equation\n- Variable elimination\n\n6. Problem solving keywords:\n- Rational inequality\n- Variable manipulation\n- Interval solution\n- Parameter solving\n- Simplification',
    solutions:
      '문제 *5*와 *6*을 해결하는 과정을 단계별로 설명하겠습니다.\n\n### 문제 *5* \n#### 연립부등식 \\((x-15)/(2x-2) \\leq x+3\\) 의 해가 부등식 \\(6x + 5 = 8y\\)에서 x, y 수 중의 값을 구하십시오.\n\n**Step 1:** 주어진 부등식 \\((x-15)/(2x-2) \\leq x+3\\)을 해결하기 위해 같은 분모를 가지도록 정리합니다.\n\\[ \\frac{x-15}{2x-2} - x - 3 \\leq 0 \\]\n\\[ \\frac{x-15 - (x+3)(2x-2)}{2x-2} \\leq 0 \\]\n\\[ \\frac{-2x^2 - 4x + 21}{2x-2} \\leq 0 \\]\n\n**Step 2:** 분모를 보정하고 조건을 충족시키는 \\(x\\)의 값을 찾습니다.\n\\[ -2x^2 - 4x + 21 = 0 \\]\n\\[ 2x^2 + 4x - 21 = 0 \\]\n\\[ (2x - 3)(x + 7) = 0 \\]\n\\[ x = \\frac{3}{2}, -7 \\]\n\n**Step 3:** 부호 분석을 통하여 부등식을 만족시키는 \\(x\\) 값의 범위를 판별합니다.\n해에 해당하는 부분은 부호가 음수이기 때문에, \\( 2x-2 \\neq 0 \\) 이므로 \\(x \\neq 1\\) 일 때,\n\\[ -7 < x < \\frac{3}{2} \\]\n\n**Step 4:** \\(6x + 5 = 8y\\) 부등식에 \\(x\\)의 해를 대입하여 \\(y\\)의 값을 구합니다. 이 값을 통해 실제 \\(x\\), \\(y\\) 값을 얻어냅니다.\n다만, 부등식의 해가 구체적인 값을 요구하므로 추가 계산 없이 특정 조건을 만족하는 \\(x\\), \\(y\\) 값은 명확하지 않습니다.\n이 문제는 추가 정보나 수정이 필요할 수 있습니다.\n\n### 문제 *6*\n#### 연립부등식 \\((x+a)/(2x+4) > 5\\) 의 해가 \\(5<x<5\\)일 때, \\(a\\)의 값은?\n\n**Step 1:** 주어진 부등식을 정리합니다.\n\\[ \\frac{x+a}{2x+4} > 5 \\]\n\\[ x + a > 10x + 20 \\]\n\\[ a > 9x + 20 \\]\n\n**Step 2:** \\(5 < x < 5\\)는 해가 존재하지 않는 표현입니다. 이는 아마도 인쇄 오류 또는 문제의 제시 오류일 수 있습니다. 이것을 \\(x = 5\\)로 가정하면,\n\\[ a > 9(5) + 20 \\]\n\\[ a > 45 + 20 \\]\n\\[ a > 65 \\]\n\n이때 제시된 선택지 중에서는 적합한 \\(a\\)의 값이 없습니다. 문제 자체에 오류가 있거나 누락된 정보가 있을 가능성이 큽니다.',
    ocrs: '*5* 연립부등식 (x-15)/(2x-2)≤x+3 의 해가 부등식 6x+5=8y 에서 x, y수 중의 값을 구하시오.\n\n*6* 연립부등식 (x+a)/(2x+4)>5 의 해가 5<x<5일 때, a의 값은?\n①1     ②2     ③3\n④4     ⑤5',
  };

  const parseOcrProblems = (ocrs: string) => {
    const problems = ocrs.split(/\*([0-9]+)\*/).slice(1);
    const parsedProblems: { [key: number]: string } = {};

    for (let i = 0; i < problems.length; i += 2) {
      const problemNumber = parseInt(problems[i], 10);
      parsedProblems[problemNumber] = problems[i + 1].trim();
    }

    return parsedProblems;
  };

  const problemTexts = parseOcrProblems(ocrResponse.ocrs);

  const [penguinPosition, setPenguinPosition] = useState<THREE.Vector3>(
    new THREE.Vector3(0, 0.5, 0)
  );
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedFloe, setSelectedFloe] = useState<number>(0);
  const penguinTargetPosition = useRef<THREE.Vector3>(
    new THREE.Vector3(0, 0.5, 0)
  );
  const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false);
  const [iceCount, setIceCount] = useState<number>(12);
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
        setShowModal(true);
      } else {
        penguinTargetPosition.current = newPosition;
      }
    },
    [icePositions, penguinPosition, problemTexts]
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
        selectedFloe={selectedFloe}
        iceCount={iceCount}
        setIceCount={setIceCount}
        studyTime={studyTime}
        breakTime={breakTime}
        isStudyRunning={isStudyRunning}
        isBreakRunning={isBreakRunning}
        onStudyStart={handleStudyStart}
        onStudyStop={handleStudyStop}
        onBreakStart={handleBreakStart}
        onBreakStop={handleBreakStop}
        selectedProblem={selectedProblem}
      />
      <AnimatePresence>
        {showModal && (
          <AnimatedModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            selectedFloe={selectedFloe}
            selectedProblem={selectedProblem}
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
  iceCount: number;
  setIceCount: (count: number) => void;
  studyTime: { hours: number; minutes: number };
  breakTime: { hours: number; minutes: number };
  isStudyRunning: boolean;
  isBreakRunning: boolean;
  onStudyStart: () => void;
  onStudyStop: () => void;
  onBreakStart: () => void;
  onBreakStop: () => void;
  selectedProblem: string;
}

const UI: React.FC<UIProps> = ({
  showDebugInfo,
  setShowDebugInfo,
  showModal,
  setShowModal,
  selectedFloe,
  iceCount,
  setIceCount,
  studyTime,
  breakTime,
  isStudyRunning,
  isBreakRunning,
  onStudyStart,
  onStudyStop,
  onBreakStart,
  onBreakStop,
  selectedProblem,
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
      <input
        type="number"
        value={iceCount}
        onChange={(e) => setIceCount(Math.max(1, parseInt(e.target.value)))}
        className="p-2 bg-white text-black rounded-lg"
        placeholder="얼음 개수"
      />
      <button
        className="p-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-200"
        onClick={() => setShowDebugInfo(!showDebugInfo)}
      >
        {showDebugInfo ? '디버그 정보 숨기기' : '디버그 정보 표시'}
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
        />
      )}
    </AnimatePresence>
  </>
);

export default Game;
