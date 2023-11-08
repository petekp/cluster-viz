"use client";

import * as THREE from "three";
import { Leva, useControls } from "leva";
import { SphereGeometry } from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { packSiblings } from "d3-hierarchy";
import { useEffect } from "react";

const CONTROL_SETTINGS = {
  sphereCount: { value: 8, min: 4, max: 80, step: 1 },
  sphereDistance: { value: 0, min: 0, max: 0.5, step: 0.01 },
  minDiameter: { value: 0.3, min: 0.05, max: 2, step: 0.1 },
  maxDiameter: { value: 3, min: 2, max: 8, step: 0.1 },
};

const COLORS = [
  "#AAAAAA",
  "#CCCCCC",
  "#111111",
  "#a6a6a6",
  "#222222",
  "#a9a9a9",
  "#333333",
  "#333444",
  "#444444",
  "#3a3a3a",
  "#b2b2b2",
  "#CCCCCC",
  "#DDDDDD",
  "#EEEEEE",
  "#888888",
  "#e8e8e8",
];

function calculateSpherePositions(
  sphereCount: number,
  sphereDistance: number,
  minDiameter: number,
  maxDiameter: number
) {
  const data = Array.from({ length: sphereCount }, () => {
    const diameter = Math.random() * (maxDiameter - minDiameter) + minDiameter;
    return {
      r: diameter / 2 + sphereDistance,
      diameter,
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
      position: positions[i],
      diameter: d.diameter,
    })),
    boundingBox,
  };
}

function Sphere({ position, diameter, color }) {
  const vectorPosition = new THREE.Vector3(...position);

  return (
    <instancedMesh
      position={vectorPosition}
      args={[
        new SphereGeometry(diameter / 2, 32, 32),
        new THREE.MeshPhysicalMaterial({
          color,
          roughness: 1,
          metalness: 0.3,
          ior: 0,
          reflectivity: 1,
          sheen: 1,
          iridescence: 1,
          iridescenceIOR: 1.2,
          thickness: 1,
          clearcoat: 1,
          clearcoatRoughness: 0.38,
          specularIntensity: 0.3,
        }),
        1,
      ]}
    />
  );
}

function Visualization() {
  const { sphereCount, sphereDistance, minDiameter, maxDiameter } =
    useControls(CONTROL_SETTINGS);
  const { camera } = useThree();

  const { spheres, boundingBox } = calculateSpherePositions(
    sphereCount,
    sphereDistance,
    minDiameter,
    maxDiameter
  );

  useEffect(() => {
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    const size = boundingBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const aspectRatio = size.x / size.y;
    const viewportAspectRatio = camera.aspect;

    let cameraZ = Math.abs(
      maxDim / 4 / Math.tan((camera.fov * (Math.PI / 180)) / 2)
    );

    // Adjust camera position or field of view based on aspect ratios
    if (aspectRatio > viewportAspectRatio) {
      cameraZ /= aspectRatio;
    } else {
      camera.fov = 2 * Math.atan(maxDim / 4 / cameraZ) * (180 / Math.PI);
    }

    camera.position.z = cameraZ;
    camera.updateProjectionMatrix();
  }, [boundingBox, camera]);

  return (
    <>
      <ambientLight intensity={0} />
      <directionalLight position={[0, -100, 100]} intensity={1} />
      <directionalLight position={[-100, 100, -400]} intensity={3} />
      <directionalLight position={[100, 100, -200]} intensity={3} />
      <directionalLight position={[0, -100, 100]} intensity={0} />
      <group position={[0, 0, -20]}>
        {spheres.map((sphere, i) => (
          <Sphere
            key={i}
            position={sphere.position}
            diameter={sphere.diameter}
            color={COLORS[i % COLORS.length]}
          />
        ))}
      </group>
    </>
  );
}

export default function Home() {
  return (
    <main className="absolute w-full h-full left-0 top-0">
      <Canvas
        shadows
        frameloop="demand"
        className="absolute w-full h-full left-0 top-0"
        camera={{ position: [0, 0, 5], fov: 20 }}
      >
        <Visualization />
      </Canvas>
      <Leva />
    </main>
  );
}
