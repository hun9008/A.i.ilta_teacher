import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraControllerProps {
  target: THREE.Vector3;
  offset?: THREE.Vector3;
  smoothness?: number;
}

const CameraController: React.FC<CameraControllerProps> = ({ 
  target, 
  offset = new THREE.Vector3(-2, 6, 6),
  smoothness = 0.1
}) => {
  const { camera } = useThree();
  const cameraPositionRef = useRef(new THREE.Vector3());
  const initialRotationRef = useRef<THREE.Euler | null>(null);

  useEffect(() => {
    cameraPositionRef.current.copy(target).add(offset);
    camera.position.copy(cameraPositionRef.current);
    camera.lookAt(target);
    initialRotationRef.current = camera.rotation.clone();
  }, []);

  useFrame(() => {
    const targetPosition = target.clone().add(offset);
    cameraPositionRef.current.lerp(targetPosition, smoothness);
    camera.position.copy(cameraPositionRef.current);

    // 카메라 방향을 초기 방향으로 고정
    if (initialRotationRef.current) {
      camera.rotation.copy(initialRotationRef.current);
    }
  });

  return null;
};

export default CameraController;