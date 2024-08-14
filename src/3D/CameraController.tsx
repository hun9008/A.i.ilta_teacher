import React, { useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const CameraController: React.FC<{ target: THREE.Vector3; targetPosition: THREE.Vector3 }> = ({ target, targetPosition }) => {
  const { camera } = useThree()
  const cameraPositionRef = useRef(new THREE.Vector3(-2, 6, 6))
  const cameraTargetRef = useRef(new THREE.Vector3())

  useFrame(() => {
    // 펭귄이 있는 위치로 카메라 타겟을 부드럽게 보간
    cameraTargetRef.current.lerp(target, 0.05)

    // 카메라의 목표 위치 계산
    const desiredPosition = new THREE.Vector3(
      targetPosition.x - 2,
      targetPosition.y + 6,
      targetPosition.z + 6
    )

    // 카메라 위치를 부드럽게 업데이트
    cameraPositionRef.current.lerp(desiredPosition, 0.05)
    camera.position.copy(cameraPositionRef.current)
    
    // 카메라가 목표 위치를 향하게 설정
    camera.lookAt(cameraTargetRef.current)
  })

  return null
}

export default CameraController
