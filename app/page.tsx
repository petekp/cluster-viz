"use client";

import * as THREE from "three";
import { useRef, useMemo } from "react";
import { Leva, useControls } from "leva";
import { InstancedMesh, SphereGeometry } from "three";
import { Canvas, useThree, useFrame } from "@react-three/fiber";

const CONTROL_SETTINGS = {
  clusters: { value: 14, min: 4, max: 80, step: 2 },
  diameter: { value: 0.75, min: 0.1, max: 100, step: 0.01 },
  distance: { value: 1.4, min: 0.1, max: 10, step: 0.1 },
  nodeCount: { value: 1000, min: 100, max: 10000, step: 20 },
  nodeSize: { value: 0.001, min: 0.001, max: 0.2, step: 0.002 },
};

const COLORS = [
  "red",
  "green",
  "blue",
  "orange",
  "purple",
  "yellow",
  "pink",
  "cyan",
  "magenta",
  "lime",
  "brown",
  "white",
  "gray",
];

function generateInitialPositions(
  nodeCount: number,
  clusterDiameter: number,
  position: [number, number, number]
): [number, number, number][] {
  const radius = clusterDiameter / 2;
  return Array.from({
    length: nodeCount,
  }).map((): [number, number, number] => {
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);

    // Convert spherical to Cartesian coordinates
    const x = position[0] + radius * Math.sin(phi) * Math.cos(theta);
    const y = position[1] + radius * Math.sin(phi) * Math.sin(theta);
    const z = position[2] + radius * Math.cos(phi);

    return [x, y, z];
  });
}

// Calculate the scale factor to fit the cluster into the clusterDiameter
function scalePositions(
  clusterDiameter: number,
  position: [number, number, number],
  initialPositions: [number, number, number][]
): [number, number, number][] {
  const radius = Math.sqrt(
    initialPositions.reduce((maxDist, [x, y, z]) => {
      const dx = x - position[0];
      const dy = y - position[1];
      const dz = z - position[2];
      return Math.max(maxDist, dx * dx + dy * dy + dz * dz);
    }, 0)
  );

  const scale = clusterDiameter / (10 * radius);
  return initialPositions.map(([x, y, z]) => [
    position[0] + (x - position[0]) * scale,
    position[1] + (y - position[1]) * scale,
    position[2] + (z - position[2]) * scale,
  ]);
}

function Cluster({
  color,
  position,
  diameter,
  nodeCount,
  nodeSize,
}: {
  color: string;
  position: [number, number, number];
  diameter: number;
  nodeCount: number;
  nodeSize: number;
}) {
  const initialPositionsRef = useRef<[number, number, number][] | null>(null);

  if (!initialPositionsRef.current) {
    initialPositionsRef.current = generateInitialPositions(
      nodeCount,
      diameter,
      position
    );
  }

  const positions = useMemo(
    () => scalePositions(diameter, position, initialPositionsRef.current!),
    [diameter, position]
  );

  const meshRef = useRef<InstancedMesh>(null!);
  const matrix = new THREE.Matrix4();

  useFrame(() => {
    if (meshRef.current) {
      positions.forEach((pos, i) => {
        meshRef.current.setMatrixAt(i, matrix.makeTranslation(...pos));
      });

      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[
        new SphereGeometry(nodeSize, 16, 16),
        new THREE.MeshBasicMaterial({ color }),
        nodeCount,
      ]}
    />
  );
}

function Clusters() {
  const { viewport } = useThree();
  const settings = useControls("Settings", CONTROL_SETTINGS);

  const scale = Math.min(viewport.width, viewport.height);

  return (
    <>
      {Array.from({ length: settings.clusters }).map((_, i) => {
        const angle = (i / settings.clusters) * 2 * Math.PI;
        const radius = (settings.distance * scale) / 4;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);

        return (
          <Cluster
            key={i}
            color={COLORS[i % COLORS.length]}
            position={[x, y, 0]}
            diameter={settings.diameter * scale} // Scale diameter with viewport size
            nodeCount={settings.nodeCount}
            nodeSize={settings.nodeSize * scale} // Scale node size with viewport size
          />
        );
      })}
    </>
  );
}

export default function Home() {
  return (
    <main className="absolute w-full h-full left-0 top-0">
      <Canvas
        frameloop="demand"
        className="absolute w-full h-full left-0 top-0"
      >
        <Clusters />
      </Canvas>
      <Leva />
    </main>
  );
}
