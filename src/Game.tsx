import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera, Grid } from '@react-three/drei'
import * as THREE from 'three'
import Penguin from './3D/Penguin'
import IceFloe from './3D/IceFloe'
import CameraController from './3D/CameraController'
import { AnimatePresence } from 'framer-motion'
import AnimatedModal from './AnimatedModal'
import logo from './assets/logo.svg'
import { LogOut, User } from 'lucide-react'
import BlinkingRec from './3D/BlinkingRec'
import DebugInfo from './3D/DebugInfo'
import Axes from './3D/Axes'

function Game() {
  const [penguinPosition, setPenguinPosition] = useState<THREE.Vector3>(new THREE.Vector3(0, 0.5, 0));
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedFloe, setSelectedFloe] = useState<number>(0);
  const penguinTargetPosition = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.5, 0));
  const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false);
  const [iceCount, setIceCount] = useState<number>(12);
  const [icePositions, setIcePositions] = useState<[number, number, number][]>([]);

  useEffect(() => {
    generateCircularIcePositions(iceCount);
  }, [iceCount]);

  const generateCircularIcePositions = (count: number) => {
    const positions: [number, number, number][] = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // 황금각
    const maxRadius = Math.sqrt(count) * 0.5; // 최대 반지름

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

  const handleFloeClick = useCallback((index: number) => {
    const newPosition = new THREE.Vector3(...icePositions[index]);
    newPosition.y = 0.5;
    if (penguinPosition.equals(newPosition)) {
      setSelectedFloe(index);
      setShowModal(true);
    } else {
      penguinTargetPosition.current = newPosition;
    }
  }, [icePositions, penguinPosition]);

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
        <Penguin position={penguinPosition.toArray()} targetPosition={penguinTargetPosition} setPenguinPosition={setPenguinPosition} />
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
      />
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
}

const UI: React.FC<UIProps> = ({ 
  showDebugInfo, 
  setShowDebugInfo, 
  showModal, 
  setShowModal, 
  selectedFloe,
  iceCount,
  setIceCount
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
        onClick={() => {/* 여기에 나가기 로직 추가 */}}
      >
        <p className='mr-2'>공부 종료하기</p>
        <LogOut size={24} />
      </button>
    </div>
    {showDebugInfo && (
      <div id="debug-info" className="absolute bottom-4 left-4 bg-white bg-opacity-75 p-2 rounded text-black">
      </div>
    )}
    <AnimatePresence>
      {showModal && (
        <AnimatedModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
          selectedFloe={selectedFloe} 
        />
      )}
    </AnimatePresence>
  </>
);

export default Game;