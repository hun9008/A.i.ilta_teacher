import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// 더 귀여운 펭귄 컴포넌트
const Penguin: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    const groupRef = useRef<THREE.Group>(null!)
  
    useFrame((state, delta) => {
      groupRef.current.rotation.y += delta * 0.5
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05 + position[1]
    })
  
    return (
      <group ref={groupRef} position={position}>
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
  };

  export default Penguin;