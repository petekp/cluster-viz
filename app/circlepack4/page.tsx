"use client";

// This prototype demonstrates a circle pack visualization with a continuous and categorical lenses. The categorical lenses support showing a SINGLE entity across all segments.

// The user is required to select a specific entity within a category to see the distribution of that entity across all segments.

import React from "react";
import { motion } from "framer-motion";
import ParentSize from "@visx/responsive/lib/components/ParentSize";
import { Group } from "@visx/group";
import { Pack, hierarchy } from "@visx/hierarchy";
import { scaleQuantile } from "@visx/scale";
import { LegendQuantile } from "@visx/legend";

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

const colorRange = ["#00ffc8", "#00d4ff", "#5641ff", "#721d9a", "#6d00a3"];
const defaultMargin = { top: 10, left: 30, right: 40, bottom: 80 };

export type LandscapeVizProps = {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  currentLens: CategoricalLens | ContinuousLens;
  selectedCategory: string | null;
};

function prepareContinuousData(data: LandscapeVisualization): any {
  return {
    id: "",
    children: data.segments,
    label: "root",
    description: "",
    count: 0,
  };
}

function transformlabel({
  scale,
  labelFormat,
}: {
  scale: any;
  labelFormat: any;
}) {
  return (d: any, i: number) => {
    const [x0, x1] = scale.invertExtent(scale(d));
    const formattedX0 = labelFormat(Math.floor(x0), i)?.toLocaleString();
    const formattedX1 = labelFormat(Math.floor(x1), i)?.toLocaleString();
    return {
      datum: d,
      index: i,
      text: `${formattedX0} – ${formattedX1}`,
      value: scale(d),
    };
  };
}

function prepareCategoricalData(
  data: LandscapeVisualization,
  selectedLens: CategoricalLens,
  selectedCategory?: string
): any {
  return {
    id: "root",
    children: data.segments.map((segment) => {
      const matchingSegment = selectedLens.segments.find(
        (s) => s.id === segment.id
      );
      const matchingCategory = matchingSegment?.categories.find(
        (c) => c.label === selectedCategory
      );
      return {
        ...segment,
        count: matchingCategory ? matchingCategory.count : 0,
      };
    }),
  };
}

type Circle = {
  x: number;
  y: number;
  r: number;
  data: {
    label: string;
    id: string;
  };
};

function LandscapeViz({
  width,
  height,
  margin = defaultMargin,
  currentLens,
  selectedCategory,
}: LandscapeVizProps) {
  type Datum = Segment & { children: any };
  const isContinuous = currentLens.type === "continuous";
  const isCategorical = currentLens.type === "categorical";

  const preparedData = React.useMemo(() => {
    if (currentLens.type === "categorical" && selectedCategory) {
      return prepareCategoricalData(newMockData, currentLens, selectedCategory);
    } else {
      return prepareContinuousData(newMockData);
    }
  }, [newMockData, currentLens, selectedCategory]);

  const root = React.useMemo(() => {
    return hierarchy<Datum>(preparedData)
      .sum((d) => d.count)
      .sort((a, b) => b.data.count - a.data.count);
  }, [preparedData, selectedCategory, currentLens]);

  const colorScale = React.useMemo(() => {
    let domain: [number, number] = [0, 0];

    if (isContinuous) {
      const { segments } = newMockData.lenses.find(
        (lens) => lens.label === currentLens.label
      ) as ContinuousLens;
      domain = extent(segments, (s) => s.mean);
    }

    if (isCategorical) {
      const { segments } = newMockData.lenses.find(
        (lens) => lens.label === currentLens.label
      ) as CategoricalLens;
      const [categories] = segments.map((s) => s.categories);
      domain = extent(categories, (cat) => cat.count);
    }

    return scaleQuantile({
      domain,
      range: colorRange,
    });
  }, [isContinuous, isCategorical]);

  return width < 10 ? null : (
    <>
      <LegendQuantile
        scale={colorScale}
        className="p-3 rounded-md bg-black bg-opacity-50 backdrop-blur-md"
        style={{
          position: "absolute",
          bottom: 12,
          right: 12,
          zIndex: 999,
        }}
        labelTransform={transformlabel}
      />

      <motion.svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
        <Pack<Datum> root={root} size={[width, height]} padding={10}>
          {(packData) => {
            const circles = packData.descendants().slice(1);
            const lensSegments = newMockData.lenses.find(
              (lens) => lens.label === currentLens.label
            )!.segments;

            return (
              <>
                <Group
                  style={{ position: "relative" }}
                  transform={`translate(${0}, ${0})`}
                >
                  {circles.map((circle, i) => {
                    const segment = lensSegments.find(
                      (segment) => segment.id === circle.data.id
                    ) as ContinuousLens["segments"][0];

                    const fill = isContinuous
                      ? colorScale?.(segment.mean)
                      : colorScale(circle.data.count);

                    return (
                      <motion.circle
                        key={`segment-${circle.data.label}`}
                        r={circle.r}
                        cx={circle.x}
                        initial={{
                          fill,
                          opacity: 0,
                          scale: 0.5,
                        }}
                        animate={{
                          scale: 1,
                          opacity: 1,
                          cx: circle.x,
                          cy: circle.y,
                          r: circle.r,
                          fill: fill,
                        }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{
                          type: "spring",
                          damping: 18,
                          stiffness: 100,
                        }}
                        cy={circle.y}
                        strokeWidth={0.2}
                        stroke={"none"}
                        fill={fill}
                      />
                    );
                  })}
                </Group>
                <Group transform={`translate(${0}, ${0})`}>
                  {circles.map((circle, i) => {
                    return (
                      <CircleLabel
                        key={`circle-label-${circle.data.label}-${circle.data.id}`}
                        circle={circle}
                        i={i}
                        lensType={currentLens.type}
                      />
                    );
                  })}
                </Group>
              </>
            );
          }}
        </Pack>
      </motion.svg>
    </>
  );
}

const CircleLabel = function CircleLabel({
  circle,
  i,
  lensType,
}: {
  circle: Circle;
  i: number;
  lensType: "categorical" | "continuous";
}) {
  const isCategoryCircle = circle.data.label.includes("Category");
  const isCategoricalLabel = lensType === "categorical" && !isCategoryCircle;
  const initialX = circle.x;
  const initialY = circle.y;
  const targetX = circle.x;
  const targetY = circle.y;
  const opacity = 1;
  const scale = 1;
  const exitX = circle.x;
  const exitY = circle.y;
  const maxFontSize = 20;
  const fontSize = Math.min(circle.r * 0.2, maxFontSize);

  return (
    <>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow
          dx="0"
          dy="2"
          stdDeviation="4"
          floodColor="black"
          floodOpacity="0.5"
        />
      </filter>
      <motion.text
        className="select-none pointer-events-none"
        key={`text-label-${circle.data.label}-${circle.data.id}-${i}`}
        initial={{
          opacity: 0,
          scale: 0,
          x: initialX,
          y: initialY,
          fontSize,
        }}
        animate={{
          scale,
          opacity,
          color: "white",
          x: targetX,
          y: targetY,
          fontSize,
        }}
        exit={{
          opacity: 0,
          scale: 1,
          x: exitX,
          y: exitY,
        }}
        color="white"
        transition={{
          type: "spring",
          damping: 20,
          stiffness: 100,
        }}
        fill="white"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {circle.data.label}
      </motion.text>
    </>
  );
};

export default function Home() {
  const [currentLens, setCurrentLens] = React.useState<string | undefined>(
    "Categorical 1"
  );
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null
  );

  console.log({ selectedCategory });

  const currentLensData =
    newMockData.lenses.find((lens) => lens.label === currentLens) ||
    newMockData.lenses[0];

  return (
    <main className="w-full h-full flex">
      <div className="flex flex-col  flex-shrink-0 p-4">
        {newMockData.lenses.map((lens, i) => {
          if (lens.type === "categorical") {
            return (
              <CategoricalLensComponent
                key={`${lens.label}-${i}`}
                lens={lens}
                setSelectedCategory={setSelectedCategory}
              />
            );
          }

          if (lens.type === "continuous") {
            return (
              <ContinuousLensComponent
                lens={lens}
                key={`${lens.label}-${i}`}
                setCurrentLens={setCurrentLens}
                setSelectedCategory={setSelectedCategory}
              />
            );
          }
        })}
      </div>
      <div className="flex flex-1 ">
        <>
          <ParentSize>
            {({ width, height }) => (
              <LandscapeViz
                width={width}
                height={height}
                currentLens={currentLensData}
                selectedCategory={selectedCategory}
              />
            )}
          </ParentSize>
        </>
      </div>
    </main>
  );
}

function CategoricalLensComponent({
  lens,
  setSelectedCategory,
}: {
  lens: CategoricalLens;
  setSelectedCategory: (category: string | null) => void;
}) {
  const categoriesBySegment = lens.segments.reduce((acc, segment) => {
    return {
      ...acc,
      [segment.id]: segment.categories,
    };
  }, {}) as Record<string, CategoricalLens["segments"][0]["categories"]>;

  return (
    <select
      key={`${lens.label}-select`}
      onChange={(e) => {
        setSelectedCategory(e.target.value);
      }}
      className="text-black"
      defaultValue={lens.label}
    >
      <option key={`${lens.label}-disabled`} disabled value={lens.label}>
        {lens.label}
      </option>
      {Object.entries(categoriesBySegment).map(([segmentId, categories], i) => {
        return (
          i < 1 &&
          categories.map((category, i) => {
            return (
              <option
                key={`${lens.label} - ${category.label} - ${i}`}
                value={`${category.label}`}
              >
                {category.label}
              </option>
            );
          })
        );
      })}
    </select>
  );
}

function ContinuousLensComponent({
  lens,
  setCurrentLens,
  setSelectedCategory,
}: {
  lens: ContinuousLens;
  setCurrentLens: (lens: string) => void;
  setSelectedCategory: (category: string | null) => void;
}) {
  return (
    <button
      key={lens.label}
      onClick={() => {
        setCurrentLens(lens.label);
        setSelectedCategory(null); // reset selected category
      }}
    >
      {lens.label}
    </button>
  );
}
