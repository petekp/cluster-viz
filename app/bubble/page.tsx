"use client";

import * as THREE from "three";
import { Leva, useControls } from "leva";
import { InstancedMesh, SphereGeometry } from "three";
import { Canvas, useThree, useFrame, extend } from "@react-three/fiber";
import { useSphere, Physics, Debug, useBox } from "@react-three/cannon";
import { useEffect, useState } from "react";
import { shaderMaterial } from "@react-three/drei";

const CONTROL_SETTINGS = {
  bubbleCount: { value: 14, min: 4, max: 80, step: 1 },
  bubbleDistance: { value: 1.4, min: 0.1, max: 10, step: 0.1 },
  minDiameter: { value: 0.1, min: 0.01, max: 1, step: 0.01 },
  maxDiameter: { value: 0.5, min: 0.01, max: 1, step: 0.01 },
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

const BubbleShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color(0x0000ff),
  },
  // Vertex Shader
  `
    varying vec3 vNormal;
    varying vec3 vUv; 

    void main() {
      vNormal = normal;
      vUv = position; 

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform vec3 uColor;
    varying vec3 vNormal;
    varying vec3 vUv;

    void main() {
      // Calculate the Fresnel term
      float fresnel = clamp(1.0 + dot(vNormal, vec3(0.0, 0.0, -1.0)), 0.0, 1.0);

      // Mix the color with white based on the Fresnel term
      vec3 color = mix(uColor, vec3(1.0), pow(fresnel, 2.0));

      // Add some noise based on the time and position to create a moving effect
      float noise = 0.2 * (0.5 - 0.5 * sin(uTime + vUv.z * 2.0));

      gl_FragColor = vec4(color + noise, 0.4); // Use alpha to make the material translucent
    }
  `
);

extend({ BubbleShaderMaterial });

function Bubble({
  diameter,
  color,
  position,
}: {
  diameter: number;
  color: string;
  position: THREE.Vector3;
}) {
  const { viewport } = useThree();
  const [ref, api] = useSphere(() => ({
    mass: 4,
    linearDamping: 0.9,
    angularDamping: 0.9,
    velocity: [0.001, 0, 0],
    restitution: 0,
    fixedRotation: true,
    friction: 100,
    args: [diameter / 2],
    position: position.toArray(),
  }));

  const [currentPosition, setCurrentPosition] = useState(new THREE.Vector3());

  useEffect(() => {
    // Subscribe to position changes
    const unsubscribe = api.position.subscribe((newPosition) => {
      setCurrentPosition(new THREE.Vector3().fromArray(newPosition));
    });

    // Unsubscribe when the component unmounts
    return () => unsubscribe();
  }, [api.position]);

  useFrame(() => {
    // Calculate the direction towards the center
    const direction = new THREE.Vector3()
      .subVectors(new THREE.Vector3(0, 0, 0), currentPosition)
      .normalize();

    // Apply a force towards the center
    api.applyForce(
      direction.multiplyScalar(3).toArray(),
      currentPosition.toArray()
    );

    // Check if the sphere is about to cross the boundary
    const radius = diameter / 2;
    const { x, y, z } = currentPosition;
    const viewportHalfWidth = viewport.width / 2; // Adjust this value according to your viewport size
    const viewportHalfHeight = viewport.height / 2; // Adjust this value according to your viewport size
    const viewportHalfDepth = viewport.distance / 2; // Adjust this value according to your viewport size

    if (Math.abs(x) + radius > viewportHalfWidth) {
      api.applyForce([-Math.sign(x) * 3, 0, 0], currentPosition.toArray());
    }
    if (Math.abs(y) + radius > viewportHalfHeight) {
      api.applyForce([0, -Math.sign(y) * 3, 0], currentPosition.toArray());
    }
    if (Math.abs(z) + radius > viewportHalfDepth) {
      api.applyForce([0, 0, -Math.sign(z) * 3], currentPosition.toArray());
    }
  });

  return (
    // @ts-ignore
    <mesh ref={ref}>
      <sphereGeometry attach="geometry" args={[diameter / 2, 32, 32]} />
      {/* @ts-ignore */}
      <bubbleShaderMaterial
        attach="material"
        uniforms-uColor-value={new THREE.Color(color)}
      />
    </mesh>
  );
}

function Bubbles() {
  const { bubbleCount, minDiameter, maxDiameter } =
    useControls(CONTROL_SETTINGS);

  const bubbles = [];

  for (let i = 0; i < bubbleCount; i++) {
    const diameter = THREE.MathUtils.randFloat(minDiameter, maxDiameter);
    const color = COLORS[i % COLORS.length];
    const position = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(10), // x
      THREE.MathUtils.randFloatSpread(10), // y
      THREE.MathUtils.randFloatSpread(0) // z
    );
    bubbles.push(
      <Bubble key={i} diameter={diameter} color={color} position={position} />
    );
  }

  return <>{bubbles}</>;
}

export default function Home() {
  return (
    <main className="absolute w-full h-full left-0 top-0">
      <Leva />
    </main>
  );
}
