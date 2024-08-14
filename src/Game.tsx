import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import Penguin from './3D/Penguin'
import IceFloe from './3D/IceFloe'
import CameraController from './3D/CameraController'
import { AnimatePresence } from 'framer-motion'
import AnimatedModal from './AnimatedModal'
import logo from './assets/logo.svg';
import { LogOut, User } from 'lucide-react';

const BlinkingRec: React.FC<{ text: string }> = ({ text }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(prev => !prev);
    }, 500); // 0.5초마다 깜빡임

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center">
      <div className={`w-3 h-3 rounded-full mr-2 ${isVisible ? 'bg-green-400' : 'bg-transparent'}`} />
      <span>{text}</span>
    </div>
  );
};

const Game: React.FC = () => {
  const [penguinPosition, setPenguinPosition] = useState<THREE.Vector3>(new THREE.Vector3(0, 0.5, 0))
  const [showModal, setShowModal] = useState(false)
  const [selectedFloe, setSelectedFloe] = useState<number>(0)
  const penguinTargetPosition = useRef(new THREE.Vector3(0, 0.5, 0))

  const icePositions: [number, number, number][] = Array(12).fill(0).map((_, i) => [
    (i % 4) * 2, 0, Math.floor(i / 4) * 2
  ])

  const handleFloeClick = useCallback((index: number) => {
    const newPosition = new THREE.Vector3(...icePositions[index])
    newPosition.y = 0.5
    if (penguinPosition.equals(newPosition)) {
      setSelectedFloe(index)
      setShowModal(true)
    } else {
      penguinTargetPosition.current = newPosition
    }
  }, [icePositions, penguinPosition])

  return (
    <div className="w-screen h-screen bg-gradient-to-b from-blue-100 to-blue-200 relative">
      <Canvas className="w-full h-full">
        <PerspectiveCamera makeDefault position={[-2, 6, 6]} />
        <OrbitControls />
        <CameraController target={penguinPosition} targetPosition={penguinTargetPosition.current} />
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
      </Canvas>

      <div className="absolute top-0 left-0 p-4 text-white">
      <img
        src={logo}
        alt="Logo"
        className="w-10 h-10 mb-2.5"
      />
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
      <div className="absolute bottom-4 right-4">
        <button
          className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200 flex"
          onClick={() => {/* 여기에 나가기 로직 추가 */}}
        >
          <p className='mr-2'>공부 종료하기</p>
          <LogOut size={24} />
        </button>
      </div>

      <AnimatePresence>
        {showModal && (
          <AnimatedModal 
            isOpen={showModal} 
            onClose={() => setShowModal(false)} 
            selectedFloe={selectedFloe} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Game