"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useThree, useFrame, extend } from "@react-three/fiber";
import { Leva, useControls } from "leva";
import { MeshBasicMaterial, InstancedMesh, SphereGeometry } from "three";
import { Sphere } from "@react-three/drei";

extend({ MeshBasicMaterial, InstancedMesh, Sphere });

function calculateMinDiameter(nodes: number, nodeSize: number): number {
  return Math.sqrt(nodes) * nodeSize * 0.3;
}

function calculateMaxDiameter(nodes: number, nodeSize: number): number {
  return Math.sqrt(nodes) * nodeSize * 1.2;
}

// Updating the Cluster component to resemble a TSNE map
interface ClusterProps {
  position: [number, number, number];
  nodes: number;
  clusters: number;
  color: string;
  nodeDistance: number;
  nodeSize: number;
  minClusterDiameter: number;
  maxClusterDiameter: number;
}

function Cluster({
  position,
  clusters,
  nodes,
  color,
  nodeDistance,
  nodeSize,
  minClusterDiameter,
  maxClusterDiameter,
}: ClusterProps) {
  const clusterRadius = useRef(
    Math.random() * (maxClusterDiameter - minClusterDiameter) +
      minClusterDiameter
  );

  // Generate random positions for each node to resemble a cloud of points
  const initialPositions: [number, number, number][] = useMemo(() => {
    return Array.from({
      length: nodes,
    }).map(() => {
      const radius = clusterRadius.current;
      const theta = Math.random() * 2 * Math.PI; // azimuthal angle
      const phi = Math.acos(2 * Math.random() - 1); // polar angle

      // Convert spherical to Cartesian coordinates
      const x = position[0] + radius * Math.sin(phi) * Math.cos(theta);
      const y = position[1] + radius * Math.sin(phi) * Math.sin(theta);
      const z = position[2] + radius * Math.cos(phi);

      return [x, y, z];
    });
  }, [nodes, clusterRadius]);

  const positions = useMemo(() => {
    return initialPositions.map(([x, y, z]) => {
      const dx = x - position[0];
      const dy = y - position[1];
      const dz = z - position[2];

      // Scale the distance from the center of the cluster
      const scale = nodeDistance;
      return [
        position[0] + dx * scale,
        position[1] + dy * scale,
        position[2] + dz * scale,
      ];
    });
  }, [nodeDistance, position, initialPositions]);

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
    minClusterDiameter: { value: 3, min: 1, max: 4, step: 1 },
    maxClusterDiameter: { value: 7, min: 5, max: 7, step: 1 },
  });

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
            clusters={settings.clusters}
            nodes={settings.nodes}
            color={settings.clusterColors[i % settings.clusterColors.length]}
            nodeDistance={settings.nodeDistance}
            nodeSize={settings.nodeSize}
            minClusterDiameter={settings.minClusterDiameter}
            maxClusterDiameter={settings.maxClusterDiameter}
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
