import React from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface DebugInfoProps {
  penguinPosition: THREE.Vector3;
}

const DebugInfo: React.FC<DebugInfoProps> = ({ penguinPosition }) => {
  const { camera } = useThree();
  
  useFrame(() => {
    const debugInfo = document.getElementById('debug-info');
    if (debugInfo) {
      const [px, py, pz] = penguinPosition.toArray();
      const [cx, cy, cz] = camera.position.toArray();
      const rotation = new THREE.Euler().setFromQuaternion(camera.quaternion);
      const [rx, ry, rz] = rotation.toArray();
      debugInfo.innerHTML = `
        펭귄 좌표: x: ${px.toFixed(2)}, y: ${py.toFixed(2)}, z: ${pz.toFixed(2)}<br>
        카메라 좌표: x: ${cx.toFixed(2)}, y: ${cy.toFixed(2)}, z: ${cz.toFixed(2)}<br>
        카메라 회전 (도): x: ${THREE.MathUtils.radToDeg(rx).toFixed(2)}°, y: ${THREE.MathUtils.radToDeg(ry).toFixed(2)}°, z: ${THREE.MathUtils.radToDeg(rz).toFixed(2)}°
      `;
    }
  });

  return null;
};

export default DebugInfo;