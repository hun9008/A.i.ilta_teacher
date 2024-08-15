import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'

const Penguin: React.FC<{
  position: [number, number, number]
  targetPosition: React.MutableRefObject<THREE.Vector3>
  setPenguinPosition: (position: THREE.Vector3) => void
}> = ({ position, targetPosition, setPenguinPosition }) => {
  const groupRef = useRef<THREE.Group>(null!)
  const currentPosition = useRef(new THREE.Vector3(...position))
  const isJumping = useRef(false)
  const jumpProgress = useRef(0)
  
  // GLTF 모델 로드
  const { scene } = useGLTF('/penguin.glb')

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...position)
      groupRef.current.scale.set(0.25, 0.25, 0.25)
      groupRef.current.rotation.y =+ Math.PI / 2
    }
  }, [position])

  useFrame((state, delta) => {
    if (groupRef.current) {
      if (!isJumping.current && !currentPosition.current.equals(targetPosition.current)) {
        isJumping.current = true
        jumpProgress.current = 0
      }

      if (isJumping.current) {
        jumpProgress.current += delta * 2 // Adjust this value to change jump speed
        const t = Math.sin(jumpProgress.current * Math.PI)
        
        currentPosition.current.lerp(targetPosition.current, 0.1)
        groupRef.current.position.copy(currentPosition.current)
        groupRef.current.position.y += Math.sin(t * Math.PI) * 0.5 // Adjust this value to change jump height

        if (jumpProgress.current >= 1) {
          isJumping.current = false
          currentPosition.current.copy(targetPosition.current)
          setPenguinPosition(currentPosition.current)
        }
      }

      // Rotate the penguin to face the direction of movement
      if (!currentPosition.current.equals(targetPosition.current)) {
        const direction = new THREE.Vector3().subVectors(targetPosition.current, currentPosition.current)
        const angle = Math.atan2(direction.x, direction.z)
        groupRef.current.rotation.y = angle + Math.PI / 2
      }

      // Add subtle swaying motion
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.05
    }
  })

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  )
}

export default Penguin
