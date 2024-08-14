import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const Penguin: React.FC<{
  position: [number, number, number]
  targetPosition: React.MutableRefObject<THREE.Vector3>
  setPenguinPosition: (position: THREE.Vector3) => void
}> = ({ position, targetPosition, setPenguinPosition }) => {
  const groupRef = useRef<THREE.Group>(null!)
  const currentPosition = useRef(new THREE.Vector3(...position))
  const isJumping = useRef(false)
  const jumpProgress = useRef(0)

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...position)
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
        groupRef.current.rotation.y = angle
      }

      // Add subtle swaying motion
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.05
    }
  })

  return (
    <group ref={groupRef}>
      {/* 몸통 */}
      <mesh position={[0, 0.3, 0]}>
        <capsuleGeometry args={[0.2, 0.3, 8, 16]} />
        <meshStandardMaterial color="#2C3E50" />
      </mesh>
      {/* 배 */}
      <mesh position={[0, 0.25, 0.08]}>
        <sphereGeometry args={[0.18, 32, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* 머리 */}
      <mesh position={[0, 0.65, 0]}>
        <sphereGeometry args={[0.18, 32, 32]} />
        <meshStandardMaterial color="#2C3E50" />
      </mesh>
      {/* 눈 (왼쪽) */}
      <mesh position={[-0.07, 0.7, 0.13]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[-0.08, 0.71, 0.15]}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
      {/* 눈 (오른쪽) */}
      <mesh position={[0.07, 0.7, 0.13]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0.08, 0.71, 0.15]}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
      {/* 부리 */}
      <mesh position={[0, 0.65, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.04, 0.1, 16]} />
        <meshStandardMaterial color="#F39C12" />
      </mesh>
      {/* 날개 (왼쪽) */}
      <mesh position={[-0.22, 0.3, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <capsuleGeometry args={[0.05, 0.2, 8, 16]} />
        <meshStandardMaterial color="#2C3E50" />
      </mesh>
      {/* 날개 (오른쪽) */}
      <mesh position={[0.22, 0.3, 0]} rotation={[0, 0, Math.PI / 4]}>
        <capsuleGeometry args={[0.05, 0.2, 8, 16]} />
        <meshStandardMaterial color="#2C3E50" />
      </mesh>
      {/* 발 (왼쪽) */}
      <mesh position={[-0.1, 0, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[0.08, 0.05, 0.15]} />
        <meshStandardMaterial color="#F39C12" />
      </mesh>
      {/* 발 (오른쪽) */}
      <mesh position={[0.1, 0, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[0.08, 0.05, 0.15]} />
        <meshStandardMaterial color="#F39C12" />
      </mesh>
    </group>
  )
}

export default Penguin