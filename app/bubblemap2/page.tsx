"use client";

import * as THREE from "three";
import { Leva, useControls } from "leva";
import { SphereGeometry } from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { packSiblings } from "d3-hierarchy";
import { useEffect, useState } from "react";
import { Html } from "@react-three/drei";
import { useSpring } from "@react-spring/core";
import { a } from "@react-spring/three";

const CONTROL_SETTINGS = {
  sphereDistance: { value: 8, min: 0, max: 50, step: 0.01 },
};

const COLORS = [
  "#a7351f",
  "#f2c14e",
  "#f2f2f2",
  "#e9a2f9",
  "#a2f9e9",
  "#8aa2f3",
];

const material = {
  roughness: 0.1,
  metalness: 0,
  ior: 0,
  reflectivity: 0,
  sheen: 0,
  iridescence: 0,
  iridescenceIOR: 0,
  thickness: 0,
  clearcoat: 1,
  clearcoatRoughness: 0.4,
  specularIntensity: 0,
};

const stubData = {
  totalCustomers: 1000,
  clusters: [
    {
      name: "Newly Registered Low-Spenders",
      count: 200,
      description: "This is cluster 1",
    },
    {
      name: "Established High-Spend Regulars",
      count: 50,
      description: "This is cluster 2",
    },
    {
      name: "Highly Engaged Recent Buyers",
      count: 150,
      description: "This is cluster 3",
    },
    {
      name: "Long-Term, High-Education Spenders",
      count: 250,
      description: "This is cluster 4",
    },
    {
      name: "Highly Educated Low Spenders",
      count: 100,
      description: "This is cluster 4",
    },
    {
      name: "Long-Term Mid-Income Buyers",
      count: 250,
      description: "This is cluster 4",
    },
    {
      name: "Short-Term Low-Income Buyers",
      count: 20,
      description: "This is cluster 4",
    },
    {
      name: "Long-Term High-Income Buyers",
      count: 120,
      description: "This is cluster 4",
    },
    {
      name: "Mid-Term Low-Income Buyers",
      count: 250,
      description: "This is cluster 4",
    },
    {
      name: "Short-Term Low-Income Buyers",
      count: 20,
      description: "This is cluster 4",
    },
  ],
};

function transformData(data: typeof stubData) {
  const { totalCustomers, clusters } = data;

  const minCount = Math.min(...clusters.map((cluster) => cluster.count));
  const maxCount = Math.max(...clusters.map((cluster) => cluster.count));

  const minDiameter = 60;
  const maxDiameter = 200;

  const spheres = clusters.map((cluster, i) => {
    const diameter =
      ((cluster.count - minCount) / (maxCount - minCount)) *
        (maxDiameter - minDiameter) +
      minDiameter;

    return {
      name: cluster.name,
      description: cluster.description,
      color: COLORS[i % COLORS.length],
      count: cluster.count,
      diameter,
      r: diameter / 2 + CONTROL_SETTINGS.sphereDistance.value,
    };
  });

  return { totalCustomers, spheres };
}

function calculateSpherePositions(
  sphereDistance: number,
  transformedSpheres: any[]
) {
  const data = transformedSpheres.map((sphere, i) => {
    return {
      r: sphere.diameter / 2 + sphereDistance,
      diameter: sphere.diameter,
    };
  });

  const positions = packSiblings(data).map((d) => [d.x, d.y, 0]); // set z-coordinate to 0

  const boundingBox = new THREE.Box3();
  positions.forEach((position, i) => {
    const sphereRadius = data[i].diameter / 2;
    const sphereCenter = new THREE.Vector3(...position);
    boundingBox.expandByPoint(
      sphereCenter
        .clone()
        .add(new THREE.Vector3(sphereRadius, sphereRadius, sphereRadius))
    );
    boundingBox.expandByPoint(
      sphereCenter
        .clone()
        .sub(new THREE.Vector3(sphereRadius, sphereRadius, sphereRadius))
    );
  });

  return {
    spheres: data.map((d, i) => ({
      position: positions[i] as [number, number, number],
      diameter: d.diameter,
    })),
    boundingBox,
  };
}

function Sphere({
  position,
  diameter,
  count,
  color,
  name,
  isFocused,
}: {
  position: [number, number, number];
  diameter: number;
  count: number;
  color: string;
  name: string;
  isFocused?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const vectorPosition = new THREE.Vector3(...position);

  const { scale, z } = useSpring({
    scale: isHovered || isFocused ? 1.13 : 1,
    z: isHovered || isFocused ? 5 : 1,
    intensity: isHovered || isFocused ? 0.3 : 0,
    config: { mass: 3, tension: 400, friction: 30, precision: 0.001 },
  });

  const { intensity } = useSpring({
    intensity: isHovered || isFocused ? 0.4 : 0,
  });

  const percentage = Math.round((count / stubData.totalCustomers) * 100);

  return (
    <>
      <a.directionalLight position={[0, 10, 10]} intensity={intensity} />
      {/* @ts-ignore */}
      <a.instancedMesh
        // @ts-ignore
        position={z.to((zValue) =>
          vectorPosition.add(new THREE.Vector3(0, 0, zValue))
        )}
        scale={scale}
        onPointerOver={() => {
          setIsHovered(true);
        }}
        onPointerOut={() => {
          setIsHovered(false);
        }}
        args={[
          new SphereGeometry(diameter / 2, 32, 32),
          new THREE.MeshPhysicalMaterial({
            ...material,
            color,
          }),
          1,
        ]}
      />

      <Html position={vectorPosition} style={{ pointerEvents: "none" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            userSelect: "none",
            alignItems: "center",
            justifyContent: "center",
            minHeight: `${diameter}px`,
            width: `${diameter - 25}px`,
            opacity: 0.9,
            textShadow: "0px 1px 2px 1px rgba(0, 0, 0, 0.6)",
            fontFamily: "system-ui",
            color: "white",
            textAlign: "center",
            transform: "translate(-50%, -50%)",
          }}
        >
          <div style={{ fontSize: `${diameter * 0.07}px`, fontWeight: 500 }}>
            {name}
          </div>
          <div style={{ fontSize: `${diameter * 0.07}px`, opacity: 0.7 }}>
            {percentage}%
          </div>
        </div>
      </Html>
    </>
  );
}

function Visualization() {
  const { sphereDistance } = useControls(CONTROL_SETTINGS);
  const { camera } = useThree();

  // Transform the stub data into a format suitable for sphere generation
  const { totalCustomers, spheres: transformedSpheres } =
    transformData(stubData);

  // Use the transformed data to calculate sphere positions
  const { spheres, boundingBox } = calculateSpherePositions(
    sphereDistance,
    transformedSpheres
  );

  useEffect(() => {
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    const size = boundingBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    let cameraZ = Math.abs(
      // @ts-ignore
      maxDim / 4 / Math.tan((camera.fov * (Math.PI / 180)) / 2)
    );

    camera.position.z = cameraZ;
    camera.updateProjectionMatrix();
  }, [boundingBox, camera]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[0, -100, 100]} intensity={0.5} />
      <directionalLight position={[-100, 100, -400]} intensity={0.1} />
      <directionalLight position={[100, 100, -200]} intensity={0.2} />
      <directionalLight position={[0, -100, 100]} intensity={0.8} />
      <directionalLight position={[0, 20, 0]} intensity={0.5} />
      <group>
        {spheres.map((sphere, i) => (
          <Sphere
            key={i}
            position={sphere.position}
            count={transformedSpheres[i].count}
            diameter={sphere.diameter}
            color={COLORS[i % COLORS.length]}
            name={transformedSpheres[i].name}
          />
        ))}
      </group>
    </>
  );
}

export default function Home() {
  return (
    <main className="absolute w-full h-full left-0 top-0 bg-white">
      <Canvas
        shadows
        className="absolute w-full h-full left-0 top-0"
        camera={{ position: [0, 0, 0], fov: 20 }}
        orthographic
      >
        <Visualization />
      </Canvas>
      <Leva />
    </main>
  );
}
