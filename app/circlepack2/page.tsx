"use client";

import React from "react";
import ParentSize from "@visx/responsive/lib/components/ParentSize";

import { Group } from "@visx/group";
import { Pack, hierarchy } from "@visx/hierarchy";
import { scaleQuantize } from "@visx/scale";
import rawData, {
  Exoplanets as Datum,
} from "@visx/mock-data/lib/mocks/exoplanets";

function extent<D>(allData: D[], value: (d: D) => number): [number, number] {
  return [Math.min(...allData.map(value)), Math.max(...allData.map(value))];
}

const filteredPlanets = [
  { name: "11 Com c", radius: 12.64, distance: 3.6 },
  { name: "11 Com b", radius: 10.64, distance: 50.6 },
  { name: "11 Com b", radius: 8.64, distance: 50.6 },
  { name: "11 Com b", radius: 8, distance: 50.6 },
  { name: "11 Com b", radius: 7, distance: 50.6 },
  { name: "11 Com b", radius: 6.5, distance: 50.6 },
  { name: "11 Com b", radius: 5.5, distance: 50.6 },
  { name: "11 Com b", radius: 5.2, distance: 50.6 },
  { name: "11 Com b", radius: 4.64, distance: 50.6 },
  { name: "11 Com a", radius: 4.2, distance: 20.6 },
  { name: "11 Com a", radius: 4.1, distance: 20.6 },
  { name: "11 Com a", radius: 4, distance: 20.6 },
  { name: "11 Com a", radius: 3.8, distance: 20.6 },
  { name: "11 Com a", radius: 3.5, distance: 20.6 },
  { name: "11 Com a", radius: 3, distance: 20.6 },
  { name: "11 Com a", radius: 1.8, distance: 20.6 },
  { name: "11 Com a", radius: 1, distance: 20.6 },
];

const pack = {
  children: filteredPlanets,
  name: "root",
  radius: 0,
  distance: 0,
};

const colorScale = scaleQuantize({
  domain: extent(rawData, (d) => d.radius),
  range: ["#ffe108", "#ffc10e", "#fd6d6f", "#855af2", "#11d2f9", "#49f4e7"],
});

const root = hierarchy<Datum>(pack)
  .sum((d) => d.radius * d.radius)
  .sort(
    (a, b) =>
      // sort by hierarchy, then distance
      (a?.data ? 1 : -1) - (b?.data ? 1 : -1) ||
      (a.children ? 1 : -1) - (b.children ? 1 : -1) ||
      (a.data.distance == null ? -1 : 1) - (b.data.distance == null ? -1 : 1) ||
      a.data.distance! - b.data.distance!
  );

const defaultMargin = { top: 10, left: 30, right: 40, bottom: 80 };

export type PackProps = {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
};

function Example({ width, height, margin = defaultMargin }: PackProps) {
  return width < 10 ? null : (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Pack<Datum> root={root} size={[width, height]}>
        {(packData) => {
          const circles = packData.descendants().slice(1);
          return (
            <Group>
              {circles.map((circle, i) => (
                <circle
                  key={`circle-${i}`}
                  r={circle.r}
                  cx={circle.x}
                  cy={circle.y}
                  fill={colorScale(circle.data.radius)}
                  style={{ position: "relative" }}
                >
                  <text
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      fontSize: 20,
                      color: "white",
                    }}
                  >
                    {circle.value}
                  </text>
                </circle>
              ))}
            </Group>
          );
        }}
      </Pack>
    </svg>
  );
}

export default function Home() {
  return (
    <main className="absolute w-full h-full left-0 top-0">
      <ParentSize>
        {({ width, height }) => <Example width={width} height={height} />}
      </ParentSize>
    </main>
  );
}
