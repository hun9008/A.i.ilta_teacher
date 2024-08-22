import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraControllerProps {
  target: THREE.Vector3;
  smoothness?: number;
  showModal: boolean;
}

const CameraController: React.FC<CameraControllerProps> = ({
  target,
  smoothness = 0.1,
  showModal = false,
}) => {
  const { camera, size } = useThree();
  const cameraPositionRef = useRef(new THREE.Vector3());
  const lookAtPositionRef = useRef(new THREE.Vector3());
  const showModalRef = useRef(showModal);
  const normalOffset = new THREE.Vector3(-2, 6, 6);
  const modalOffset = new THREE.Vector3(-3, 5, 5);

  useEffect(() => {
    showModalRef.current = showModal;
  }, [showModal]);

  const calculateRelativePoint = () => {
    // 기준 너비 (예: 1920px)에 대한 현재 너비의 비율 계산
    const widthRatio = size.width / 1920;
    
    // 비율에 따라 x와 z 값 조정 (1을 기준으로)
    const x = 3 * widthRatio;
    const z = 2.5 * widthRatio;
    
    return new THREE.Vector3(x, 0, z);
  };

  useFrame(() => {
    let targetPosition: THREE.Vector3;
    let targetLookAt: THREE.Vector3;

    if (showModalRef.current) {
      const relativePoint = calculateRelativePoint();
      targetLookAt = target.clone().add(relativePoint);
      targetPosition = targetLookAt.clone().add(modalOffset);
    } else {
      targetLookAt = target.clone();
      targetPosition = target.clone().add(normalOffset);
    }

    cameraPositionRef.current.lerp(targetPosition, smoothness);
    camera.position.copy(cameraPositionRef.current);

    lookAtPositionRef.current.lerp(targetLookAt, smoothness);

    const direction = lookAtPositionRef.current.clone().sub(camera.position).normalize();

    camera.quaternion.setFromRotationMatrix(
      new THREE.Matrix4().lookAt(camera.position, camera.position.clone().add(direction), camera.up)
    );
  });

  return null;
};

export default CameraController;