"use client";

import React from "react";
import ParentSize from "@visx/responsive/lib/components/ParentSize";

import { Group } from "@visx/group";
import { Pack, hierarchy } from "@visx/hierarchy";
import { scaleLinear } from "@visx/scale";
import { animated } from "react-spring";

import {
  CategoricalLens,
  ContinuousLens,
  LandscapeVisualization,
  Segment,
  generateMockData,
} from "./mockData";

function extent<D>(allData: D[], value: (d: D) => number): [number, number] {
  return [Math.min(...allData.map(value)), Math.max(...allData.map(value))];
}

const newMockData = generateMockData({
  numSegments: 15,
  numTotalCustomers: 200000,
});

const defaultMargin = { top: 10, left: 30, right: 40, bottom: 80 };

function prepareDataForVisualization(
  data: LandscapeVisualization,
  selectedLens: CategoricalLens | ContinuousLens
): any {
  // Categorical lens
  return {
    id: "root",
    children: data.segments.map((segment) => {
      const matchingSegment = selectedLens.segments.find(
        (s) => s.id === segment.id
      );
      return {
        ...segment,
        children: matchingSegment ? matchingSegment.categories : [],
      };
    }),
  };
}

export type LandscapeVizProps = {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  currentLens: CategoricalLens | ContinuousLens;
};

function LandscapeViz({
  width,
  height,
  margin = defaultMargin,
  currentLens,
}: LandscapeVizProps) {
  const preparedData = prepareDataForVisualization(newMockData, currentLens);

  type Datum = Omit<Segment, "children">;

  const root = hierarchy<Datum>(preparedData)
    .sum((d) => d.count * d.count)
    .sort((a, b) => b?.data.count - a?.data.count);

  const lens = newMockData.lenses.find(
    (lens) => lens.label === currentLens.label
  ) as CategoricalLens;

  const [categories] = lens.segments.map((segment) => segment.categories);
  const domain = extent(categories, (cat) => cat.count);
  console.log(domain);
  const colorScale = scaleLinear({
    domain,
    range: ["#222", "#eee"],
  });

  return width < 10 ? null : (
    <animated.svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      <Pack<Datum> root={root} size={[width, height]}>
        {(packData) => {
          const circles = packData.descendants().slice(1);

          return (
            <Group>
              {circles.map((circle, i) => {
                return (
                  <>
                    <animated.circle
                      key={`circle-${i}`}
                      r={circle.r}
                      cx={circle.x}
                      cy={circle.y}
                      fill={colorScale(circle.data.count)}
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
  const currentLensData =
    newMockData.lenses.find((lens) => lens.label === currentLens) ||
    newMockData.lenses[0];

  return (
    <main className="absolute w-full h-full left-0 top-0">
      <select
        onChange={(e) => setCurrentLens(e.target.value)}
        style={{ all: "unset" }}
      >
        {newMockData.lenses
          .filter((lens) => lens.type === "categorical")
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
            currentLens={currentLensData}
          />
        )}
      </ParentSize>
    </main>
  );
}
