import React, { useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface IceFloeProps {
  position: [number, number, number];
  solved: boolean;
  onClick: () => void;
}

const IceFloe: React.FC<IceFloeProps> = ({ position, solved, onClick }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const { scene } = useGLTF('/iceberg.glb');

  useEffect(() => {
    if (groupRef.current) {
      const rotationAxis = Math.random() < 0.5 ? 'x' : 'z';
      if (rotationAxis === 'x') {
        groupRef.current.rotation.x = Math.PI;
      } else {
        groupRef.current.rotation.z = Math.PI;
      }
    }
  }, []);

  useEffect(() => {
    const clonedScene = scene.clone(); // 클론된 scene을 사용
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = child.material.clone(); // Material을 개별적으로 복제
        child.material.transparent = true;
        child.material.opacity = solved ? 1 : 0.2;
      }
    });
    groupRef.current.clear(); // 그룹 초기화
    groupRef.current.add(clonedScene); // 그룹에 클론된 scene 추가
  }, [solved, scene]);

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={onClick}
    />
  );
};

export default IceFloe;
