import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface IceFloeProps {
  position: [number, number, number];
  onPointerOver?: () => void;
  onClick?: () => void;
}

const IceFloe: React.FC<IceFloeProps> = ({ position, onPointerOver, onClick }) => {
  const [hovered, setHovered] = useState(false)
  const meshRef = useRef<THREE.Mesh>(null!)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.001
      meshRef.current.rotation.z += 0.001
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={() => {
        setHovered(true)
        if (onPointerOver) {
          onPointerOver()
        }
      }}
      onPointerOut={() => setHovered(false)}
      onClick={() => {
        if (onClick) {
          onClick()
        }
      }}
    >
      <icosahedronGeometry args={[0.5, 1]} />
      <meshStandardMaterial
        color={hovered ? 'lightblue' : 'white'}
        roughness={0.3}
        metalness={0.2}
      />
    </mesh>
  )
}

export default IceFloe
