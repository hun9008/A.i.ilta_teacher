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
  const { camera } = useThree();
  const cameraPositionRef = useRef(new THREE.Vector3());
  const lookAtPositionRef = useRef(new THREE.Vector3());
  const showModalRef = useRef(showModal);
  const normalOffset = new THREE.Vector3(-2, 6, 6);
  const modalOffset = new THREE.Vector3(-3, 5, 5);

  useEffect(() => {
    showModalRef.current = showModal;
  }, [showModal]);

  useFrame(() => {
    let targetPosition: THREE.Vector3;
    let targetLookAt: THREE.Vector3;

    if (showModalRef.current) {
      const relativePoint = new THREE.Vector3(1, 0, 1);
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