import React, { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import Penguin from './3D/Penguin'
import IceFloe from './3D/IceFloe'

const Game: React.FC = () => {
  const [penguinPosition, setPenguinPosition] = useState<[number, number, number]>([0, 0.5, 0])
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([-2, 6, 6])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const icePositions: [number, number, number][] = Array(12).fill(0).map((_, i) => [
    (i % 4) * 2 - 2, 0, Math.floor(i / 4) * 2 - 2
  ])

  const handleIceFloeHover = (position: [number, number, number]) => {
    setCameraPosition([position[0] - 2, 6, position[2] + 6])
  }

  const handleIceFloeClick = (position: [number, number, number]) => {
    setPenguinPosition([position[0], position[1] + 0.5, position[2]])
    setIsModalOpen(true)
  }

  return (
    <div className="w-screen h-screen bg-gradient-to-b from-blue-100 to-blue-200">
      <Canvas className="w-full h-full">
        <PerspectiveCamera makeDefault position={cameraPosition} />
        <OrbitControls />
        <ambientLight intensity={1} />
        <pointLight position={[10, 10, 10]} />
        <fog attach="fog" args={['#b9d5ff', 0, 20]} />
        {icePositions.map((position, index) => (
          <IceFloe 
            key={index} 
            position={position} 
            onPointerOver={() => handleIceFloeHover(position)} 
            onClick={() => handleIceFloeClick} 
          />
        ))}
        <Penguin position={penguinPosition} />
      </Canvas>
      <div className="absolute top-0 left-0 p-4 text-white">
        <h1 className="text-2xl font-bold">Penguin Ice Crossing</h1>
        <p>Hover over the ice floes to move the penguin</p>
      </div>
      {isModalOpen && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded">
            <h2 className="text-xl font-bold mb-4">Ice Floe Information</h2>
            <p>This is an information window about the selected ice floe.</p>
            <button 
              className="mt-4 p-2 bg-blue-500 text-white rounded"
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Game
