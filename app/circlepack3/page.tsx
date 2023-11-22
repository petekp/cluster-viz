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
  numSegments: 10,
  numTotalCustomers: 200000,
});

console.log(newMockData);

const defaultMargin = { top: 10, left: 30, right: 40, bottom: 80 };

export type LandscapeVizProps = {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  currentLens: CategoricalLens | ContinuousLens;
};

function prepareDataForVisualization(
  data: LandscapeVisualization,
  selectedLens: CategoricalLens | ContinuousLens
): any {
  if (selectedLens.type === "categorical") {
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
  } else {
    // Continuous lens
    return {
      id: "",
      children: data.segments,
      label: "root",
      description: "",
      count: data.segments.reduce((total, segment) => total + segment.count, 0),
    };
  }
}

function LandscapeViz({
  width,
  height,
  margin = defaultMargin,
  currentLens,
}: LandscapeVizProps) {
  type Datum = Segment & { children: any };

  const preparedData = prepareDataForVisualization(newMockData, currentLens);

  const root = hierarchy<Datum>(preparedData, (d) => d.children)
    .sum((d) => {
      return d.count;
    })
    .sort((a, b) => b?.data.count - a?.data.count);

  let colorScale = scaleLinear({
    domain: extent(newMockData.segments, (d) => d.count),
    range: ["#222", "#fff"],
  });

  if (currentLens.type === "continuous") {
    const lens = newMockData.lenses.find(
      (lens) => lens.label === currentLens.label && lens.type === "continuous"
    ) as ContinuousLens;

    if (lens) {
      const domain = extent(lens.segments, (segment) => segment.mean);
      colorScale = scaleLinear({
        domain,
        range: ["#222", "#fff"],
      });
    }
  }

  if (currentLens.type === "continuous") {
    const lens = newMockData.lenses.find(
      (lens) => lens.label === currentLens.label && lens.type === "categorical"
    ) as CategoricalLens;

    if (lens) {
      const [categories] = lens.segments.map((segment) => segment.categories);
      const domain = extent(categories, (cat) => cat.count);

      colorScale = scaleLinear({
        domain,
        range: ["#222", "#fff"],
      });
    }
  }

  return width < 10 ? null : (
    <animated.svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      <Pack<Datum> root={root} size={[width, height]}>
        {(packData) => {
          const circles = packData.descendants();
          const lensSegments = newMockData.lenses.find(
            (lens) => lens.label === currentLens.label
          )!.segments;

          return (
            <Group>
              {circles.map((circle, i) => {
                ////////// CONTINUOUS /////////
                if (currentLens.type === "continuous") {
                  const segment = lensSegments?.find(
                    (segment) => segment.id === circle.data.id
                  ) as ContinuousLens["segments"][0];

                  return (
                    <animated.circle
                      key={`circle-${i}`}
                      r={circle.r}
                      cx={circle.x}
                      cy={circle.y}
                      fill={segment ? colorScale?.(segment.mean) : "#FFF"}
                    />
                  );
                }

                ////////// CATEGORICAL /////////
                if (currentLens.type === "categorical") {
                  console.log(circle);
                  return circle?.children?.map((category, j) => {
                    return (
                      <>
                        <animated.circle
                          key={`circle-${i}-${j}`}
                          r={category.r}
                          cx={category.x}
                          cy={category.y}
                          fill={colorScale?.(category.count) || "#FFF"}
                          style={{ position: "relative" }}
                        />
                        <text>{category.data.description || ""}</text>
                      </>
                    );
                  });
                }
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
    "Continuous Lens 1"
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
        {newMockData.lenses.map((lens) => (
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
