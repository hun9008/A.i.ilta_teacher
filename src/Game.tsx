import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Grid } from '@react-three/drei';
import * as THREE from 'three';
import Penguin from './3D/Penguin';
import IceFloe from './3D/IceFloe';
import CameraController from './3D/CameraController';
import { AnimatePresence } from 'framer-motion';
import AnimatedModal from './AnimatedModal';
import DebugInfo from './3D/DebugInfo';
import Axes from './3D/Axes';
import { useWebSocket } from './WebSocketContext';
import GameUI from './GameUI';
import { useWebcamStream } from './WebcamStreamContext';

function Game() {
  const [selectedProblem, setSelectedProblem] = useState<string>('');
  const [selectedConcept, setSelectedConcept] = useState<string>('');
  const { ocrResponse } = useWebSocket();
  const [showChatModal, setShowChatModal] = useState<boolean>(false);
  const [iceCount, setIceCount] = useState(5);
  const [solvedProblems, setSolvedProblems] = useState<{ [key: number]: boolean }>({});

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

  useEffect(() => {
    if (
      ocrResponse &&
      typeof ocrResponse === 'object' &&
      'ocrs' in ocrResponse &&
      'concepts' in ocrResponse
    ) {
      console.log("ocrresponse와서 얼음 개수 반영되는중");
      problemTexts = parseOcrProblems((ocrResponse as OcrResponse).ocrs);

      concepts = (ocrResponse as OcrResponse).concepts.reduce(
        (acc: { [key: number]: string }, concept, index) => {
          acc[index + 1] = concept;
          return acc;
        },
        {}
      );
      setIceCount(Object.keys(problemTexts).length);
    } else {
      console.log("ocr안와서 일단 초기 몇개 생성");
    }

    // 초기 solvedProblems 상태 설정
    const initialSolvedState = Array(iceCount).fill(false).reduce((acc, _, index) => {
      acc[index] = false;
      return acc;
    }, {} as { [key: number]: boolean });

    setSolvedProblems(initialSolvedState);

    generateCircularIcePositions(iceCount);
  }, [iceCount, ocrResponse]);

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
        setSelectedFloe(index);
        setSelectedProblem(problemTexts[index + 1] || '');
        setSelectedConcept(concepts[index + 1] || 'No concept available');
        setShowModal(true);
      } else {
        penguinTargetPosition.current = newPosition;
      }
      console.log(solvedProblems);
    },
    [icePositions, penguinPosition, problemTexts, concepts]
  );

  const handleSolveProblem = useCallback(() => {
    setSolvedProblems((prev) => ({ ...prev, [selectedFloe]: true }));
    setShowModal(false);
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
            solved={solvedProblems[index]}
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
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Game;
