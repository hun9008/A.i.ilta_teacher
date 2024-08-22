import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Grid } from '@react-three/drei';
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
  const { ocrResponse, solutionResponse } = useWebSocket();
  const [showChatModal, setShowChatModal] = useState<boolean>(false);
  const [iceCount, setIceCount] = useState<number>(5); // 초기값을 5로 설정
  const [solvedProblems, setSolvedProblems] = useState<{
    [key: number]: boolean;
  }>({});
  const [enableTTS, setEnableTTS] = useState<boolean>(false);

  interface OcrResponse {
    ocrs: string[];
  }
  interface SolutionResponse {
    concepts: string[];
  }

  const parseOcrProblems = (ocrs: string[]): { [key: number]: string } => {
    const parsedProblems: { [key: number]: string } = {};

    ocrs.forEach((ocr) => {
      const problems = ocr.split(/\*([0-9]+)\*/).slice(1);
      for (let i = 0; i < problems.length; i += 2) {
        const problemNumber = parseInt(problems[i], 10);
        const problemText =
          problems[i + 1]?.trim().replace(/^\\n+|\\n+$/g, '') || '';
        parsedProblems[problemNumber] = problemText;
      }
    });

    return parsedProblems;
  };

  const [problemTexts, setProblemTexts] = useState<{ [key: number]: string }>(
    {}
  );
  const [concepts, setConcepts] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    if (
      ocrResponse &&
      typeof ocrResponse === 'object' &&
      'ocrs' in ocrResponse
    ) {
      console.log('ocrresponse와서 얼음 개수 반영되는중');
      const parsedProblems = parseOcrProblems(
        (ocrResponse as OcrResponse).ocrs
      );
      setProblemTexts(parsedProblems);
      setIceCount(Object.keys(parsedProblems).length); // 문제 수에 맞게 iceCount 설정
    } else {
      console.log('ocr안와서 일단 초기 몇개 생성');
    }

    if (
      solutionResponse &&
      typeof solutionResponse === 'object' &&
      'concepts' in solutionResponse
    ) {
      const parsedConcepts = (
        solutionResponse as SolutionResponse
      ).concepts.reduce((acc: { [key: number]: string }, concept, index) => {
        acc[index + 1] = concept;
        return acc;
      }, {});
      setConcepts(parsedConcepts);
    }
  }, [ocrResponse, solutionResponse]);

  useEffect(() => {
    // 초기 solvedProblems 상태 설정
    const initialSolvedState = Array(iceCount)
      .fill(false)
      .reduce((acc, _, index) => {
        acc[index + 1] = false;
        return acc;
      }, {} as { [key: number]: boolean });

    setSolvedProblems(initialSolvedState);
    generateCircularIcePositions(iceCount);
  }, [iceCount]); // iceCount가 변경될 때마다 실행

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

  const calculateElapsedTime = () => {
    const initialStudyTime = parseInt(localStorage.getItem('studyTime') || '0');
    const initialBreakTime = parseInt(localStorage.getItem('breakTime') || '0');

    const remainingStudyMinutes = studyTime.hours * 60 + studyTime.minutes;
    const remainingBreakMinutes = breakTime.hours * 60 + breakTime.minutes;

    const usedStudyMinutes = initialStudyTime - remainingStudyMinutes;
    const usedBreakMinutes = initialBreakTime - remainingBreakMinutes;

    return {
      usedStudyMinutes,
      usedBreakMinutes,
    };
  };

  const sendTimeDataToServer = async () => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const u_id = localStorage.getItem('u_id');
    const s_id = localStorage.getItem('s_id');

    const { usedStudyMinutes, usedBreakMinutes } = calculateElapsedTime();

    const payload = {
      u_id: u_id,
      s_id: s_id,
      study_time: usedStudyMinutes,
      break_time: usedBreakMinutes,
    };

    try {
      const response = await fetch(`${baseUrl}/study/realtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to send data to server');
      }

      const data = await response.json();
      console.log('Server response:', data);
    } catch (error) {
      console.error('Error sending time data to server:', error);
    }
  };

  const handleEndStudySession = async () => {
    await sendTimeDataToServer();
    navigate('/main');
  };

  const generateCircularIcePositions = (count: number) => {
    const positions: [number, number, number][] = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const maxRadius = Math.sqrt(count) * 0.6;

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
        const problemNumber = parseInt(Object.keys(problemTexts)[index], 10);
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
    setSolvedProblems((prev) => {
      const newState = { ...prev, [selectedFloe]: true };
      console.log(newState);
      return newState;
    });
    setShowModal(false);

    setShowSolvedMessage(true); // "Solved!" 메시지 표시

    setTimeout(() => {
      setShowSolvedMessage(false); // 일정 시간 후 메시지 숨김
    }, 2000);

    console.log('이 문제 풀었음!', selectedFloe);
  }, [selectedFloe]);

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

  const { isStreaming } = useWebcamStream();
  useEffect(() => {
    console.log('Webcam isStreaming:', isStreaming);
  }, [isStreaming]);

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
            solved={solvedProblems[index + 1]}
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
