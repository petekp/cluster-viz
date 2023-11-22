"use client";

import React from "react";
import ParentSize from "@visx/responsive/lib/components/ParentSize";

import { Group } from "@visx/group";
import { Pack, hierarchy } from "@visx/hierarchy";
import { scaleLinear } from "@visx/scale";
import { animated } from "react-spring";

import { ContinuousLens, Segment, generateMockData } from "./mockData";

function extent<D>(allData: D[], value: (d: D) => number): [number, number] {
  return [Math.min(...allData.map(value)), Math.max(...allData.map(value))];
}

const newMockData = generateMockData({
  numSegments: 15,
  numTotalCustomers: 200000,
});

const defaultMargin = { top: 10, left: 30, right: 40, bottom: 80 };

export type LandscapeVizProps = {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  currentLens: string | undefined;
};

function LandscapeViz({
  width,
  height,
  margin = defaultMargin,
  currentLens,
}: LandscapeVizProps) {
  const pack = {
    id: "",
    children: newMockData.segments,
    label: "root",
    description: "",
    count: 0,
  };

  type Datum = Omit<Segment, "children">;

  const root = hierarchy<Datum>(pack)
    .sum((d) => d.count * d.count)
    .sort(
      (a, b) =>
        // sort by hierarchy, then distance
        b?.data.count - a?.data.count
    );

  let colorScale = scaleLinear({
    domain: extent(newMockData.segments, (d) => d.count),
    range: ["#222", "#fff"],
  });

  if (currentLens) {
    const lens = newMockData.lenses.find(
      (lens) => lens.label === currentLens && lens.type === "continuous"
    ) as ContinuousLens;

    if (lens) {
      const domain = extent(lens.segments, (segment) => segment.mean);
      colorScale = scaleLinear({
        domain,
        range: ["#222", "#fff"],
      });
    }
  }

  console.log(colorScale?.(0));

  return width < 10 ? null : (
    <animated.svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      <Pack<Datum> root={root} size={[width, height]}>
        {(packData) => {
          const circles = packData.descendants().slice(1);
          const lensSegments = newMockData.lenses.find(
            (lens) => lens.label === currentLens
          )?.segments;

          return (
            <Group>
              {circles.map((circle, i) => {
                const segment = lensSegments?.find(
                  (segment) => segment.id === circle.data.id
                ) as ContinuousLens["segments"][0];

                return (
                  <>
                    <animated.circle
                      key={`circle-${i}`}
                      r={circle.r}
                      cx={circle.x}
                      cy={circle.y}
                      fill={segment ? colorScale?.(segment.mean) : "#FFF"}
                      style={{ position: "relative" }}
                    />
                    <text
                      key={`text-${i}`}
                      x={circle.x}
                      y={circle.y}
                      fontSize={circle.r * 0.2}
                      fill="black"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {circle.data.label}
                    </text>
                  </>
                );
              })}
            </Group>
          );
        }}
      </Pack>
    </animated.svg>
  );
}

export default function Home() {
  const [currentLens, setCurrentLens] = React.useState<string | undefined>(
    undefined
  );

  return (
    <main className="absolute w-full h-full left-0 top-0">
      <select
        onChange={(e) => setCurrentLens(e.target.value)}
        style={{ all: "unset" }}
      >
        {newMockData.lenses
          .filter((lens) => lens.type === "continuous")
          .map((lens) => (
            <option value={lens.label} key={lens.label}>
              {lens.label}
            </option>
          ))}
      </select>

      <ParentSize>
        {({ width, height }) => (
          <LandscapeViz
            width={width}
            height={height}
            currentLens={currentLens}
          />
        )}
      </ParentSize>
    </main>
  );
}
