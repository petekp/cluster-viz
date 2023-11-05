"use client";

import { useRef } from "react";
import * as THREE from "three";
import { Canvas, useThree, useFrame, extend } from "@react-three/fiber";
import { Leva, useControls } from "leva";
import { MeshBasicMaterial, InstancedMesh, SphereGeometry } from "three";
import { Sphere } from "@react-three/drei";

extend({ MeshBasicMaterial, InstancedMesh, Sphere });

// Updating the Cluster component to resemble a TSNE map
interface ClusterProps {
  position: [number, number, number];
  nodes: number;
  color: string;
  nodeDistance: number;
  nodeSize: number;
}

function Cluster({
  position,
  nodes,
  color,
  nodeDistance,
  nodeSize,
}: ClusterProps) {
  const { viewport } = useThree();
  const clusterRadius = viewport.width / 4; // Adjust cluster radius based on viewport width

  // Generate random positions for each node to resemble a cloud of points
  const positions: [number, number, number][] = Array.from({
    length: nodes,
  }).map(() => [
    position[0] +
      (Math.random() * clusterRadius * 2 - clusterRadius) * nodeDistance,
    position[1] +
      (Math.random() * clusterRadius * 2 - clusterRadius) * nodeDistance,
    position[2] +
      (Math.random() * clusterRadius - clusterRadius / 2) * nodeDistance, // Reduced z-depth for a flatter scene
  ]);

  // Use InstancedMesh for better performance
  const meshRef = useRef<InstancedMesh>(null!);
  useFrame(() => {
    positions.forEach((pos, i) => {
      meshRef.current.setMatrixAt(
        i,
        new THREE.Matrix4().makeTranslation(...pos)
      );
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[
        new SphereGeometry(nodeSize, 16, 16),
        new THREE.MeshBasicMaterial({ color }),
        nodes,
      ]}
    />
  );
}

function Clusters() {
  const { viewport } = useThree(); // Get viewport size
  const settings = useControls("Settings", {
    clusters: { value: 8, min: 4, max: 80, step: 2 },
    nodes: { value: 1000, min: 100, max: 10000, step: 20 },
    clusterColors: {
      value: [
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
      ],
      options: [
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
      ],
    },
    clusterDistance: { value: 0.2, min: 0.1, max: 0.3, step: 0.02 },
    nodeDistance: { value: 0.15, min: 0.1, max: 1, step: 0.01 },
    nodeSize: { value: 0.01, min: 0.001, max: 0.2, step: 0.002 },
  });

  return (
    <>
      {Array.from({ length: settings.clusters }).map((_, i) => (
        <Cluster
          key={i}
          position={[
            ((i - settings.clusters / 2) *
              settings.clusterDistance *
              viewport.width) /
              2,
            0,
            0,
          ]}
          nodes={settings.nodes}
          color={settings.clusterColors[i]}
          nodeDistance={settings.nodeDistance}
          nodeSize={settings.nodeSize}
        />
      ))}
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
