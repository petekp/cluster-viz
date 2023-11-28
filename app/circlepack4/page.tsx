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

const colorRange = ["#6d00a3", "#721d9a", "#5641ff", "#00d4ff", "#00ffc8"];

export type LandscapeVizProps = {
  width: number;
  height: number;
  data: LandscapeVisualization;
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
  currentLens,
  selectedCategory,
  data,
}: LandscapeVizProps) {
  if (!data) return null;
  type Datum = Segment & { children: any };
  const isContinuous = currentLens.type === "continuous";
  const isCategorical = currentLens.type === "categorical";

  const preparedData = React.useMemo(() => {
    if (currentLens.type === "categorical" && selectedCategory) {
      return prepareCategoricalData(data, currentLens, selectedCategory);
    } else {
      return prepareContinuousData(data);
    }
  }, [data, currentLens, selectedCategory]);

  const root = React.useMemo(() => {
    return hierarchy<Datum>(preparedData)
      .sum((d) => d.count)
      .sort((a, b) => {
        return b.data.count - a.data.count;
      });
  }, [preparedData, selectedCategory, currentLens]);

  const colorScale = React.useMemo(() => {
    let domain: [number, number] = [0, 0];

    if (isContinuous) {
      const { segments } = data.lenses.find(
        (lens) => lens.label === currentLens.label
      ) as ContinuousLens;
      domain = extent(segments, (s) => s.mean);
    }

    if (isCategorical) {
      const { segments } = data.lenses.find(
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
            const lensSegments = data.lenses.find(
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
  const initialX = circle.x;
  const initialY = circle.y;
  const targetX = circle.x;
  const targetY = circle.y;
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
          opacity: 1,
          scale: 1,
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
  const [data, setData] = React.useState<LandscapeVisualization | null>(null);
  const [currentLens, setCurrentLens] = React.useState<string | undefined>(
    "Categorical 1"
  );
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null
  );

  React.useEffect(() => {
    const mockData = generateMockData({
      numSegments: 80,
      numTotalCustomers: 1000000,
    });
    setData(mockData);
  }, []);

  if (!data) {
    return null; // or a loading spinner
  }

  const handleLensSelection = (
    selectedLens: string,
    selectedCategory: string | null
  ) => {
    setCurrentLens(selectedLens);
    setSelectedCategory(selectedCategory);
  };

  const currentLensData =
    data.lenses.find((lens) => lens.label === currentLens) || data.lenses[0];

  return (
    <main className="w-full h-full flex">
      <div className="flex flex-col  flex-shrink-0 p-4">
        {data.lenses.map((lens, i) => {
          if (lens.type === "categorical") {
            return (
              <CategoricalLensComponent
                key={`categorical-${lens.label}-${i}`}
                lens={lens}
                onSelect={handleLensSelection}
              />
            );
          }

          if (lens.type === "continuous") {
            return (
              <ContinuousLensComponent
                lens={lens}
                key={`continuous-${lens.label}-${i}`}
                onSelect={handleLensSelection}
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
                data={data}
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
  onSelect,
}: {
  lens: CategoricalLens;
  onSelect: (selectedLens: string, selectedCategory: string | null) => void;
}) {
  const [selectedOption, setSelectedOption] = React.useState(lens.label);

  const categories = lens.segments[0].categories;

  return (
    <select
      onChange={(e) => {
        setSelectedOption(e.target.value);
        onSelect(lens.label, e.target.value);
      }}
      className="text-black"
      value={selectedOption}
    >
      <option disabled value={lens.label}>
        {lens.label}
      </option>
      {categories.map((category, i) => (
        <option
          key={`${lens.label} - ${category.label} - ${i}`}
          value={`${category.label}`}
        >
          {category.label}
        </option>
      ))}
    </select>
  );
}

function ContinuousLensComponent({
  lens,
  onSelect,
}: {
  lens: ContinuousLens;
  onSelect: (selectedLens: string, selectedCategory: string | null) => void;
}) {
  return (
    <button key={lens.label} onClick={() => onSelect(lens.label, null)}>
      {lens.label}
    </button>
  );
}
