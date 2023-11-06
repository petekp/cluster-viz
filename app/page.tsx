"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Leva, useControls } from "leva";
import { InstancedMesh, SphereGeometry } from "three";

// Updating the Cluster component to resemble a TSNE map
interface ClusterProps {
  position: [number, number, number];
  color: string;
  nodeCount: number;
  nodeDistance: number;
  nodeSize: number;
  minRadius: number;
  maxRadius: number;
}

// Function to generate random positions for each node to resemble a cloud of points
function generateInitialPositions(
  nodeCount: number,
  clusterRadius: number,
  position: [number, number, number]
): [number, number, number][] {
  return Array.from({
    length: nodeCount,
  }).map((): [number, number, number] => {
    const radius = clusterRadius;
    const theta = Math.random() * 2 * Math.PI; // azimuthal angle
    const phi = Math.acos(2 * Math.random() - 1); // polar angle

    // Convert spherical to Cartesian coordinates
    const x = position[0] + radius * Math.sin(phi) * Math.cos(theta);
    const y = position[1] + radius * Math.sin(phi) * Math.sin(theta);
    const z = position[2] + radius * Math.cos(phi);

    return [x, y, z];
  });
}

// Function to scale the distance from the center of the cluster
function scalePositions(
  nodeDistance: number,
  position: [number, number, number],
  initialPositions: [number, number, number][]
) {
  return initialPositions.map(([x, y, z]) => {
    const dx = x - position[0];
    const dy = y - position[1];
    const dz = z - position[2];

    const scale = nodeDistance;
    return [
      position[0] + dx * scale,
      position[1] + dy * scale,
      position[2] + dz * scale,
    ];
  });
}

function Cluster({
  position,
  nodeCount,
  color,
  nodeDistance,
  nodeSize,
  minRadius,
  maxRadius,
}: ClusterProps) {
  const clusterRadius = useRef(
    Math.random() * (maxRadius - minRadius) + minRadius
  );

  const initialPositions: [number, number, number][] = useMemo(
    () => generateInitialPositions(nodeCount, clusterRadius.current, position),
    [nodeCount, clusterRadius]
  );

  const positions = useMemo(
    () => scalePositions(nodeDistance, position, initialPositions),
    [nodeDistance, position, initialPositions]
  );

  const meshRef = useRef<InstancedMesh>(null!);
  const matrix = new THREE.Matrix4();
  useFrame(() => {
    if (meshRef.current) {
      positions.forEach((pos, i) => {
        meshRef.current.setMatrixAt(
          i,
          matrix.makeTranslation(...(pos as [number, number, number]))
        );
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
  const { viewport } = useThree(); // Get viewport size
  const settings = useControls("Settings", {
    clusters: { value: 8, min: 4, max: 80, step: 2 },
    nodeCount: { value: 1000, min: 100, max: 10000, step: 20 },
    clusterDistance: { value: 0.2, min: 0.1, max: 0.3, step: 0.02 },
    nodeDistance: { value: 0.15, min: 0.1, max: 1, step: 0.01 },
    nodeSize: { value: 0.01, min: 0.001, max: 0.2, step: 0.002 },
    minRadius: { value: 3, min: 1, max: 4, step: 1 },
    maxRadius: { value: 7, min: 5, max: 7, step: 1 },
  });

  const colors = [
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

  return (
    <>
      {Array.from({ length: settings.clusters }).map((_, i) => {
        const angle = (i / settings.clusters) * 2 * Math.PI; // Calculate angle around the circle
        const clusterRadius = (settings.clusterDistance * viewport.width) / 2;
        const x = clusterRadius * Math.cos(angle);
        const y = clusterRadius * Math.sin(angle);

        return (
          <Cluster
            key={i}
            position={[x, y, 0]}
            nodeCount={settings.nodeCount}
            color={colors[i % colors.length]}
            nodeDistance={settings.nodeDistance}
            nodeSize={settings.nodeSize}
            minRadius={settings.minRadius}
            maxRadius={settings.maxRadius}
          />
        );
      })}
    </>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-0">
      <Canvas
        frameloop="demand"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <Clusters />
      </Canvas>
      <Leva />
    </main>
  );
}
