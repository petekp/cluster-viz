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
import { colord } from "colord";

import {
  CategoricalLens,
  ContinuousLens,
  LandscapeVisualization,
  Segment,
  generateMockData,
} from "./mockData";
import { debounce } from "lodash";

function extent<D>(allData: D[], value: (d: D) => number): [number, number] {
  return [Math.min(...allData.map(value)), Math.max(...allData.map(value))];
}

const colorRange = ["#3900DC", "#842AF6", "#BD0DC1", "#00D4FF", "#00FFC8"];
const colorRange2 = ["#3900DC", "#6D29FF", "#AB00FC", "#E40089", "#FFB763"];

const transitionConfig = {
  type: "spring",
  damping: 2,
  mass: 0.2,
  stiffness: 5,
};

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
  type Datum = Segment & { children: any };
  const isContinuous = currentLens.type === "continuous";
  const isCategorical = currentLens.type === "categorical";
  console.log(data.lenses);

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
      console.log(domain);
    }

    return scaleQuantile({
      domain,
      range: colorRange2,
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
                      ? colorScale(segment.mean)
                      : colorScale(circle.data.count);

                    const isFillLight = colord(fill).isLight();
                    const lightFill = colord(fill).lighten(0.8).toHex();
                    const darkFill = colord(fill).darken(0.8).toHex();
                    const labelColor = isFillLight ? darkFill : lightFill;

                    if (!circle.r || !circle.x || !circle.y) {
                      return null;
                    }

                    let innerCircleRadius;
                    if (isContinuous) {
                      innerCircleRadius =
                        (segment.mean / segment.max) * circle.r;
                    } else {
                      innerCircleRadius =
                        (circle.data.count / circle.parent.value) * circle.r;
                    }

                    return (
                      <>
                        <defs>
                          <mask id={`inner-stroke-${i}`}>
                            <rect width="50%" height="50%" fill="white" />
                            <circle cx="50%" cy="50%" r="45%" fill="black" />
                          </mask>
                        </defs>
                        <motion.circle
                          key={`circle-segment-inner-${circle.data.label}`}
                          initial={{
                            fill,
                            r: innerCircleRadius,
                            cx: circle.x,
                            cy: circle.y,
                            opacity: 0,
                            scale: 0.5,
                          }}
                          animate={{
                            fill: fill,
                            r: innerCircleRadius,
                            cx: circle.x,
                            cy: circle.y,
                            opacity: 1,
                            scale: 1,
                          }}
                          exit={{
                            fill: fill,
                            r: innerCircleRadius,
                            cx: circle.x,
                            cy: circle.y,
                            opacity: 0,
                            scale: 0,
                          }}
                          transition={transitionConfig}
                        />
                        <motion.circle
                          key={`circle-segment-${circle.data.label}`}
                          mask={`url(#${`inner-stroke-${i}`}})`}
                          filter="url(#inner-stroke-filter)"
                          initial={{
                            fill,
                            r: circle.r,
                            cx: circle.x,
                            cy: circle.y,
                            opacity: 0,
                            scale: 0.5,
                          }}
                          animate={{
                            fill: fill,
                            r: circle.r,
                            cx: circle.x,
                            cy: circle.y,
                            opacity: 1,
                            scale: 1,
                          }}
                          exit={{
                            fill: fill,
                            r: circle.r,
                            cx: circle.x,
                            cy: circle.y,
                            opacity: 0,
                            scale: 0,
                          }}
                          transition={transitionConfig}
                        />
                        <CircleLabel
                          key={`label-${circle.data.label}`}
                          circle={circle}
                          color={labelColor}
                        />
                      </>
                    );
                  })}
                </Group>
              </>
            );
          }}
        </Pack>
        <filter id="inner-stroke-filter">
          <feMorphology
            in="SourceGraphic"
            operator="dilate"
            radius="2"
            result="dilated"
          />
          <feComposite in="SourceGraphic" in2="dilated" operator="xor" />
        </filter>
      </motion.svg>
    </>
  );
}

function CircleLabel({ circle, color }: { circle: Circle; color: string }) {
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
        transition={transitionConfig}
        textAnchor="middle"
        dominantBaseline="middle"
        initial={{
          opacity: 0,
          scale: 0,
          fill: color,
          x: circle.x,
          y: circle.y,
          fontSize,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          fill: color,
          x: circle.x,
          y: circle.y,
          fontSize,
        }}
        exit={{
          opacity: 0,
          scale: 0,
          fill: color,
          x: circle.x,
          y: circle.y,
          fontSize,
        }}
      >
        {circle.data.label}
      </motion.text>
    </>
  );
}

export default function Home() {
  const [data, setData] = React.useState<LandscapeVisualization | null>(null);
  const [currentLens, setCurrentLens] = React.useState<string | undefined>(
    "Continuous 1"
  );
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null
  );
  const [numSegments, setNumSegments] = React.useState(12);

  const debouncedSetNumSegments = React.useCallback(
    debounce(setNumSegments, 250),
    []
  );

  React.useEffect(() => {
    const mockData = generateMockData({
      numSegments: numSegments,
      numTotalCustomers: 1000000,
    });
    setData(mockData);
  }, [numSegments]);

  if (!data) {
    return null;
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
        <div className="flex flex-col mb-4">
          <label htmlFor="numSegments"># segments {numSegments}</label>
          <input
            type="range"
            id="numSegments"
            name="numSegments"
            min="1"
            max="200"
            value={numSegments}
            onChange={(e) => debouncedSetNumSegments(Number(e.target.value))}
          />
        </div>
        {data.lenses.map((lens, i) => {
          if (lens.type === "continuous") {
            return (
              <ContinuousLensComponent
                currentLens={currentLens}
                lens={lens}
                key={`continuous-${lens.label}-${i}`}
                onSelect={handleLensSelection}
              />
            );
          }

          if (lens.type === "categorical") {
            return (
              <CategoricalLensComponent
                key={`categorical-${lens.label}-${i}`}
                lens={lens}
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
  currentLens,
  onSelect,
}: {
  lens: ContinuousLens;
  currentLens: string | undefined;
  onSelect: (selectedLens: string, selectedCategory: string | null) => void;
}) {
  return (
    <button
      key={lens.label}
      className={`${
        currentLens === lens.label ? "border-pink-500" : ""
      } border border-gray-800 p-2`}
      onClick={() => onSelect(lens.label, null)}
    >
      {lens.label}
    </button>
  );
}
