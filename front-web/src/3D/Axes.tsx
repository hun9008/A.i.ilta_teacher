import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

interface AxesProps {
  length?: number;
}

const Axes: React.FC<AxesProps> = ({ length = 20 }) => {
  const points = useMemo(() => [
    [new THREE.Vector3(0, 0, 0), new THREE.Vector3(length, 0, 0)],
    [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, length, 0)],
    [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, length)]
  ], [length]);

  const colors = [0xff0000, 0x00ff00, 0x0000ff];
  const labels = ['X', 'Y', 'Z'];

  return (
    <group>
      {points.map((point, index) => (
        <React.Fragment key={index}>
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array(point.flatMap(p => p.toArray()))}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color={colors[index]} />
          </line>
          <Text
            position={point[1]}
            color={colors[index]}
            fontSize={0.5}
            anchorX="center"
            anchorY="middle"
          >
            {labels[index]}
          </Text>
        </React.Fragment>
      ))}
    </group>
  );
};

export default Axes;