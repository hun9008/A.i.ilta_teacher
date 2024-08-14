import React, { useState, useCallback, useRef } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import Penguin from './3D/Penguin'
import IceFloe from './3D/IceFloe'

const CameraController: React.FC<{ target: THREE.Vector3 }> = ({ target }) => {
  const { camera } = useThree()
  const cameraPositionRef = useRef(new THREE.Vector3(-2, 6, 6))
  const cameraTargetRef = useRef(new THREE.Vector3())

  useFrame(() => {
    // Smoothly update the camera target
    cameraTargetRef.current.lerp(target, 0.05)
    
    // Calculate the desired camera position based on the current target
    const desiredPosition = new THREE.Vector3(
      cameraTargetRef.current.x - 2,
      cameraTargetRef.current.y + 6,
      cameraTargetRef.current.z + 6
    )
    
    // Smoothly update the camera position
    cameraPositionRef.current.lerp(desiredPosition, 0.05)
    
    // Apply the calculated position and lookAt to the camera
    camera.position.copy(cameraPositionRef.current)
    camera.lookAt(cameraTargetRef.current)
  })

  return null
}

const Game: React.FC = () => {
  const [penguinPosition, setPenguinPosition] = useState<THREE.Vector3>(new THREE.Vector3(0, 0.5, 0))
  const [showModal, setShowModal] = useState(false)
  const [selectedFloe, setSelectedFloe] = useState<number | null>(null)

  const icePositions: [number, number, number][] = Array(12).fill(0).map((_, i) => [
    (i % 4) * 2, 0, Math.floor(i / 4) * 2
  ])

  const handleFloeHover = useCallback((index: number) => {
    const newPosition = new THREE.Vector3(...icePositions[index])
    newPosition.y = 0.5 // Adjust for penguin height
    setPenguinPosition(newPosition)
  }, [icePositions])

  const handleFloeClick = useCallback((index: number) => {
    setSelectedFloe(index)
    setShowModal(true)
  }, [])

  return (
    <div className="w-screen h-screen bg-gradient-to-b from-blue-100 to-blue-200 relative">
      <Canvas className="w-full h-full">
        <PerspectiveCamera makeDefault position={[-2, 6, 6]} />
        <CameraController target={penguinPosition} />
        <OrbitControls makeDefault />
        <ambientLight intensity={1} />
        <pointLight position={[10, 10, 10]} />
        <fog attach="fog" args={['#b9d5ff', 0, 20]} />
        {icePositions.map((position, index) => (
          <IceFloe 
            key={index} 
            position={position} 
            onPointerOver={() => handleFloeHover(index)}
            onClick={() => handleFloeClick(index)}
          />
        ))}
        <Penguin position={penguinPosition.toArray()} />
      </Canvas>
      <div className="absolute top-0 left-0 p-4 text-white">
        <h1 className="text-2xl font-bold">Penguin Ice Crossing</h1>
        <p>Hover over ice floes to move the penguin</p>
      </div>
      {showModal && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Ice Floe Information</h2>
            <p>You clicked on Ice Floe #{selectedFloe !== null ? selectedFloe + 1 : ''}</p>
            <button 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => setShowModal(false)}
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