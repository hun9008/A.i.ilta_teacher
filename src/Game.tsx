import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Grid, Plane } from '@react-three/drei';
import * as THREE from 'three';
import Penguin from './3D/Penguin';
import IceFloe from './3D/IceFloe';
import CameraController from './3D/CameraController';
import { AnimatePresence, motion } from 'framer-motion';
import AnimatedModal from './AnimatedModal';
import DebugInfo from './3D/DebugInfo';
import Axes from './3D/Axes';
import { useWebSocket } from './WebSocketContext';
import GameUI from './GameUI';
import { useWebcamStream } from './WebcamStreamContext';
import { useNavigate } from 'react-router-dom';

function Game() {
  const [selectedProblem, setSelectedProblem] = useState<string>('');
  const [selectedConcept, setSelectedConcept] = useState<string>('');
  const { solutionResponse } = useWebSocket();
  const [showChatModal, setShowChatModal] = useState<boolean>(false);
  const [iceCount, setIceCount] = useState<number>(5);
  const [solvedProblems, setSolvedProblems] = useState<{
    [key: number]: boolean;
  }>({});
  const [enableTTS, setEnableTTS] = useState<boolean>(false);

  const [problemTexts, setProblemTexts] = useState<{ [key: number]: string }>(
    {}
  );
  const [concepts, setConcepts] = useState<{ [key: number]: string }>({});

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
  const [showSolvedMessage, setShowSolvedMessage] = useState(false);

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
  const navigate = useNavigate();

  interface SolResp {
    concepts: string[];
  }

  useEffect(() => {
    // 로컬 스토리지에서 수정된 문제 불러오기
    const editedProblemsJSON = localStorage.getItem('editedProblems');
    if (editedProblemsJSON) {
      const editedProblems = JSON.parse(editedProblemsJSON);
      setProblemTexts(editedProblems);
      setIceCount(Object.keys(editedProblems).length);
      console.log(
        'Edited problems loaded from localStorage:',
        editedProblemsJSON
      );

      // 초기 solvedProblems 상태 설정
      const initialSolvedState = Object.keys(editedProblems).reduce(
        (acc, key) => {
          acc[parseInt(key)] = false;
          return acc;
        },
        {} as { [key: number]: boolean }
      );
      setSolvedProblems(initialSolvedState);

      // Ice positions 생성
      generateCircularIcePositions(Object.keys(editedProblems).length);
      const lowestProblemNumber = Math.min(
        ...Object.keys(editedProblems).map(Number)
      );
      setSelectedFloe(lowestProblemNumber);
      setSelectedProblem(editedProblems[lowestProblemNumber] || '');
      setSelectedConcept(
        concepts[lowestProblemNumber] || 'No concept available'
      );
      setShowModal(true);
    }
  }, []);

  useEffect(() => {
    if (
      solutionResponse &&
      typeof solutionResponse === 'object' &&
      'concepts' in solutionResponse
    ) {
      console.log('Solution response received, updating concepts');
      const parsedConcepts: { [key: number]: string } = {};
      (solutionResponse as SolResp).concepts.forEach((concept, index) => {
        const problemNumber = Object.keys(problemTexts)[index];
        if (problemNumber) {
          parsedConcepts[parseInt(problemNumber)] = concept;
        }
      });
      setConcepts(parsedConcepts);
    }
  }, [solutionResponse, problemTexts]);

  useEffect(() => {
    // 초기 solvedProblems 상태 설정
    const initialSolvedState = Object.keys(problemTexts).reduce((acc, key) => {
      acc[parseInt(key)] = false;
      return acc;
    }, {} as { [key: number]: boolean });
    setSolvedProblems(initialSolvedState);
    generateCircularIcePositions(iceCount);
  }, [iceCount, problemTexts]); // iceCount가 변경될 때마다 실행

  const handleEndStudySession = async () => {
    await sendTimeDataToServer();
    navigate('/main');
  };

  const generateCircularIcePositions = (count: number) => {
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const maxRadius = Math.sqrt(count) * 0.6;
    setIcePositions(
      Array.from({ length: count }, (_, i) => {
        const t = i / count;
        const radius = maxRadius * Math.sqrt(t);
        const theta = i * goldenAngle;
        return [radius * Math.cos(theta), 0, radius * Math.sin(theta)] as [
          number,
          number,
          number
        ];
      })
    );
  };

  const handleFloeClick = useCallback(
    (index: number) => {
      const newPosition = new THREE.Vector3(...icePositions[index]);
      newPosition.y = 0.5;
      if (penguinPosition.equals(newPosition)) {
        const problemNumbers = Object.keys(problemTexts).map(Number);
        const problemNumber = problemNumbers[index];
        setSelectedFloe(problemNumber);
        setSelectedProblem(problemTexts[problemNumber] || '');
        setSelectedConcept(concepts[problemNumber] || 'No concept available');
        setShowModal(true);
      } else {
        penguinTargetPosition.current = newPosition;
      }
    },
    [icePositions, penguinPosition, problemTexts, concepts]
  );

  const handleSolveProblem = useCallback(() => {
    console.log(selectedFloe);
    setSolvedProblems((prev) => ({ ...prev, [selectedFloe]: true }));
    setShowModal(false);
    setShowSolvedMessage(true); // "Solved!" 메시지 표시
    setTimeout(() => setShowSolvedMessage(false), 2000);
    console.log('이 문제 풀었음!', selectedFloe);
  }, [selectedFloe]);

  useEffect(() => {
    console.log(solvedProblems);
  }, [solvedProblems]);

  /* 아래부턴 타이머 부분 */
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    const decreaseTime = (
      setTime: React.Dispatch<
        React.SetStateAction<{ hours: number; minutes: number }>
      >
    ) => {
      setTime((prev) =>
        prev.minutes > 0
          ? { ...prev, minutes: prev.minutes - 1 }
          : prev.hours > 0
          ? { hours: prev.hours - 1, minutes: 59 }
          : prev
      );
    };
    if (isStudyRunning)
      timer = setInterval(() => decreaseTime(setStudyTime), 60000);
    if (isBreakRunning)
      timer = setInterval(() => decreaseTime(setBreakTime), 60000);
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isStudyRunning, isBreakRunning]);

  const handleStudyStart = useCallback(() => {
    setIsStudyRunning(true);
    setIsBreakRunning(false);
  }, []);
  const handleStudyStop = useCallback(() => setIsStudyRunning(false), []);
  const handleBreakStart = useCallback(() => {
    setIsBreakRunning(true);
    setIsStudyRunning(false);
  }, []);
  const handleBreakStop = useCallback(() => setIsBreakRunning(false), []);
  const { isStreaming } = useWebcamStream();
  useEffect(() => {
    console.log('Webcam isStreaming:', isStreaming);
  }, [isStreaming]);

  const calculateElapsedTime = () => {
    const initialStudyTime = parseInt(localStorage.getItem('studyTime') || '0');
    const initialBreakTime = parseInt(localStorage.getItem('breakTime') || '0');
    const remainingStudyMinutes = studyTime.hours * 60 + studyTime.minutes;
    const remainingBreakMinutes = breakTime.hours * 60 + breakTime.minutes;
    return {
      usedStudyMinutes: initialStudyTime - remainingStudyMinutes,
      usedBreakMinutes: initialBreakTime - remainingBreakMinutes,
    };
  };

  const sendTimeDataToServer = async () => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const u_id = localStorage.getItem('u_id');
    const s_id = localStorage.getItem('s_id');
    const { usedStudyMinutes, usedBreakMinutes } = calculateElapsedTime();
    try {
      const response = await fetch(`${baseUrl}/study/realtime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          u_id,
          s_id,
          study_time: usedStudyMinutes,
          break_time: usedBreakMinutes,
        }),
      });
      if (!response.ok) throw new Error('Failed to send data to server');
      console.log('Server response:', await response.json());
    } catch (error) {
      console.error('Error sending time data to server:', error);
    }
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-b from-blue-100 to-blue-200 relative">
      <Canvas className="w-full h-full">
        <PerspectiveCamera makeDefault position={[-2, 8, 8]} />
        <CameraController
          target={penguinPosition}
          smoothness={0.1}
          showModal={showModal}
        />
        <ambientLight intensity={1} />
        <pointLight position={[10, 10, 10]} />
        <fog attach="fog" args={['#b9d5ff', 0, 20]} />
        <Plane
          args={[1500, 1500]} // Plane 크기 조절
          rotation={[-Math.PI / 2, 0, 0]} // Plane을 바닥으로 회전
          position={[0, -100, 0]} // Plane의 위치 설정
          onClick={(e) => {
            e.stopPropagation();
            setShowModal(false);
          }} // Plane 클릭 시 showModal을 false로 설정
        >
          <meshBasicMaterial attach="material" color="#b9d5ff" />
        </Plane>
        {icePositions.map((position, index) => {
          const problemNumbers = Object.keys(problemTexts).map(Number);
          const problemNumber = problemNumbers[index];
          return (
            <IceFloe
              key={problemNumber}
              position={position}
              solved={solvedProblems[problemNumber]}
              onClick={(e) => {
                e.stopPropagation();
                handleFloeClick(index);
              }}
            />
          );
        })}
        <Penguin
          position={penguinPosition.toArray()}
          targetPosition={penguinTargetPosition}
          setPenguinPosition={setPenguinPosition}
        />
        {showDebugInfo && <Grid args={[20, 20]} />}
        {showDebugInfo && <Axes length={5} />}
        {showDebugInfo && <DebugInfo penguinPosition={penguinPosition} />}
      </Canvas>
      <GameUI
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
        onEndStudySession={handleEndStudySession}
        onSolve={handleSolveProblem}
        enableTTS={enableTTS}
        setEnableTTS={setEnableTTS}
      />
      <AnimatePresence>
        {showModal && (
          <AnimatedModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            selectedFloe={selectedFloe}
            selectedProblem={selectedProblem}
            selectedConcept={selectedConcept}
            onSolve={handleSolveProblem}
            enableTTS={enableTTS}
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
            onSolve={handleSolveProblem}
            enableTTS={enableTTS}
          />
        )}
      </AnimatePresence>
      {showSolvedMessage && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center text-7xl font-bold text-primary-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          🎉정답!🥳
        </motion.div>
      )}
    </div>
  );
}

export default Game;
