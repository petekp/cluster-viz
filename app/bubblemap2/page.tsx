"use client";

import * as THREE from "three";
import { Leva, useControls } from "leva";
import { SphereGeometry } from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { packSiblings } from "d3-hierarchy";
import { useEffect } from "react";
import { Html } from "@react-three/drei";

const CONTROL_SETTINGS = {
  sphereDistance: { value: 2, min: 0, max: 50, step: 0.01 },
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

const material = {
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
};

const stubData = {
  totalCustomers: 1000,
  clusters: [
    {
      name: "Cluster 1",
      count: 200,
      description: "This is cluster 1",
    },
    {
      name: "Cluster 2",
      count: 50,
      description: "This is cluster 2",
    },
    {
      name: "Cluster 3",
      count: 150,
      description: "This is cluster 3",
    },
    {
      name: "Cluster 4",
      count: 250,
      description: "This is cluster 4",
    },
    {
      name: "Cluster 5",
      count: 100,
      description: "This is cluster 4",
    },
    {
      name: "Cluster 6",
      count: 250,
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

    console.log(diameter);
    return {
      name: cluster.name,
      description: cluster.description,
      color: COLORS[i % COLORS.length],
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
      position: positions[i],
      diameter: d.diameter,
    })),
    boundingBox,
  };
}

function Sphere({ position, diameter, color, name }) {
  const vectorPosition = new THREE.Vector3(...position);

  console.log(diameter);

  return (
    <>
      <instancedMesh
        position={vectorPosition}
        args={[
          new SphereGeometry(diameter / 2, 32, 32),
          new THREE.MeshPhysicalMaterial({ ...material, color }),
          1,
        ]}
      />
      <Html position={vectorPosition}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: `${diameter}px`,
            minWidth: `${diameter}px`,
            fontSize: `${diameter * 0.1}px`,
            fontFamily: "system-ui",
            color: "white",
            textAlign: "center",
            position: "relative",
            transform: "translate(-50%, -50%)",
          }}
        >
          {name}
        </div>
      </Html>
    </>
  );
}

function Visualization() {
  const { sphereCount, sphereDistance, minDiameter, maxDiameter } =
    useControls(CONTROL_SETTINGS);
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
      <group position={[0, 0, 0]}>
        {spheres.map((sphere, i) => (
          <Sphere
            key={i}
            position={sphere.position}
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
    <main className="absolute w-full h-full left-0 top-0">
      <Canvas
        shadows
        frameloop="demand"
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
