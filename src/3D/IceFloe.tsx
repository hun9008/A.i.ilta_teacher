import React, { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, Outlines } from '@react-three/drei'
import * as THREE from 'three'

interface IceFloeProps {
  position: [number, number, number];
  onPointerOver?: () => void;
  onClick?: () => void;
}

const IceFloe: React.FC<IceFloeProps> = ({ position, onPointerOver, onClick }) => {
  const [hovered, setHovered] = useState(false)
  const groupRef = useRef<THREE.Group>(null!)
  const { scene } = useGLTF('/iceberg.glb')

  useEffect(() => {
    if (groupRef.current) {
      // Randomly choose between rotating around x or z axis
      const rotationAxis = Math.random() < 0.5 ? 'x' : 'z'
      
      // Apply rotation
      if (rotationAxis === 'x') {
        groupRef.current.rotation.x = Math.PI
      } else {
        groupRef.current.rotation.z = Math.PI
      }
    }
  }, [])

  return (
    <group
      ref={groupRef}
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
      <primitive object={scene.clone()} />
      {hovered && (
        <Outlines
          screenspace
          toneMapped={false}
          polygonOffset
          polygonOffsetFactor={100}
          transparent
          opacity={1}
          color="white"
          angle={Math.PI}
          thickness={0.1}
        />
      )}
    </group>
  )
}

export default IceFloe

{/* 기존 mesh 코드 (주석 처리)
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
      roughness={0.1}
      metalness={0.2}
    />
    {hovered && (
      <Outlines
        screenspace
        toneMapped={false}
        polygonOffset
        polygonOffsetFactor={100}
        transparent
        opacity={1}
        color="white"
        angle={Math.PI}
        thickness={0.1}
      />
    )}
  </mesh>
*/}