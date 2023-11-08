"use client";

import * as THREE from "three";
import { Leva, useControls } from "leva";
import { InstancedMesh, SphereGeometry } from "three";
import { Canvas, useThree, useFrame, extend } from "@react-three/fiber";
import { useEffect, useState } from "react";

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

function Bubble() {
  return null;
}

function BubbleMap() {
  return null;
}

export default function Home() {
  return (
    <main className="absolute w-full h-full left-0 top-0">
      <Canvas
        shadows
        camera={{ fov: 50, position: [0, 0, 2] }}
        frameloop="demand"
        className="absolute w-full h-full left-0 top-0"
      >
        <BubbleMap />
      </Canvas>
      <Leva />
    </main>
  );
}
