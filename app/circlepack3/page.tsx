"use client";

import React from "react";
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
import { AnimatePresence, motion } from "framer-motion";
import { useWindowSize } from "usehooks-ts";

function extent<D>(allData: D[], value: (d: D) => number): [number, number] {
  return [Math.min(...allData.map(value)), Math.max(...allData.map(value))];
}

const newMockData = generateMockData({
  numSegments: 10,
  numTotalCustomers: 200000,
});

const defaultMargin = { top: 10, left: 30, right: 40, bottom: 80 };

export type LandscapeVizProps = {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  currentLens: CategoricalLens | ContinuousLens;
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

function prepareCategoricalData(
  data: LandscapeVisualization,
  selectedLens: CategoricalLens
): any {
  return {
    id: "root",
    children: data.segments.map((segment) => {
      const matchingSegment = selectedLens.segments.find(
        (s) => s.id === segment.id
      );
      return {
        ...segment,
        children: matchingSegment ? matchingSegment.categories : [],
        count: segment.count, // use the segment count, not the category counts
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

function prepareDataForVisualization(
  data: LandscapeVisualization,
  selectedLens: CategoricalLens | ContinuousLens
): any {
  const preparedData =
    selectedLens.type === "continuous"
      ? prepareContinuousData(data)
      : prepareCategoricalData(data, selectedLens as CategoricalLens);

  // Log the sum of the count values for debugging
  const sum = preparedData.children.reduce(
    (acc: any, child: any) => acc + child.count,
    0
  );
  console.log(`Sum of count values for ${selectedLens.type} lens: ${sum}`);

  return preparedData;
}

const colorRange = ["#00ffc8", "#00d4ff", "#5641ff", "#721d9a", "#6d00a3"];

function LandscapeViz({
  width,
  height,
  margin = defaultMargin,
  currentLens,
}: LandscapeVizProps) {
  type Datum = Segment & { children: any };
  const isContinuous = currentLens.type === "continuous";
  const isCategorical = currentLens.type === "categorical";
  const { width: screenWidth, height: screenHeight } = useWindowSize();

  const preparedData = React.useMemo(() => {
    return prepareDataForVisualization(newMockData, currentLens);
  }, [newMockData, currentLens]);

  const root = React.useMemo(() => {
    return hierarchy<Datum>(preparedData)
      .sum((d) => d.count)
      .sort((a, b) => b.data.count - a.data.count);
  }, [preparedData]);

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
        style={{ position: "absolute", bottom: 0, right: 0 }}
      />
      <AnimatePresence>
        <motion.svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
        >
          <Pack<Datum> root={root} size={[width, height]} padding={8}>
            {(packData) => {
              const circles = packData.descendants().slice(1);
              const lensSegments = newMockData.lenses.find(
                (lens) => lens.label === currentLens.label
              )!.segments;

              return (
                <Group>
                  {circles.map((circle, i) => {
                    const segment = lensSegments.find(
                      (segment) => segment.id === circle.data.id
                    ) as ContinuousLens["segments"][0];

                    const isCategoryCircle =
                      circle.data.label.includes("Category");

                    return (
                      <>
                        <motion.circle
                          style={{ position: "relative", zIndex: "0" }}
                          key={
                            isCategoryCircle
                              ? Math.random()
                              : `circle-${circle.data.label}-${circle.data.id}-${i}`
                          }
                          z={isCategoryCircle ? -1 : 0}
                          r={circle.r}
                          cx={circle.x}
                          initial={{
                            ...(isCategoryCircle
                              ? { opacity: 0, scale: 0 }
                              : { opacity: 0, scale: 0.5 }),
                          }}
                          exit={{
                            ...(isCategoryCircle
                              ? { opacity: 0, scale: 0 }
                              : { opacity: 0, scale: 0.5 }),
                          }}
                          cy={circle.y}
                          transition={{
                            type: "spring",
                            damping: 18,
                            stiffness: 100,
                            ...(isCategoryCircle ? { delay: 0.37 } : {}),
                          }}
                          animate={{
                            scale: 1,
                            opacity: 1,
                            ...(isCategoryCircle
                              ? {}
                              : { cx: circle.x, cy: circle.y }),
                            r: circle.r,
                            fill: isContinuous
                              ? colorScale?.(segment.mean)
                              : colorScale(circle.data.count),
                          }}
                          fill={
                            isContinuous
                              ? colorScale?.(segment.mean)
                              : colorScale(circle.data.count)
                          }
                        />
                        <CircleLabel circle={circle} i={i} />
                        {isCategorical && !isCategoryCircle && (
                          <Annotation circle={circle} />
                        )}
                      </>
                    );
                  })}
                </Group>
              );
            }}
          </Pack>
        </motion.svg>
      </AnimatePresence>
    </>
  );
}

function Annotation({ circle }: { circle: Circle }) {
  const { width: screenWidth, height: screenHeight } = useWindowSize();

  const fontSize = 12;
  const labelWidth = circle.data.label.length * (fontSize * 0.7);
  const labelHeight = fontSize * 2.5;
  const initialX = circle.x - labelWidth / 2;
  const initialY = circle.y + (circle.r - labelHeight / 2) / 2;

  const x = circle.x - labelWidth / 2;
  const y = circle.y - circle.r - labelHeight * 1.2;

  return (
    <motion.foreignObject
      initial={{ opacity: 0, x: initialX, y: initialY }}
      animate={{ opacity: 1, x, y }}
      exit={{ opacity: 0, x: initialX, y: initialY }}
      transition={{ type: "spring", damping: 18, stiffness: 100 }}
      style={{
        zIndex: 999,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.3)",
        padding: "6px 0px",
        borderRadius: "8px",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.15)",
      }}
      width={labelWidth}
      height={labelHeight}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          fontSize,
          color: "white",
          textAlign: "center",
        }}
      >
        {circle.data.label}
      </motion.span>
    </motion.foreignObject>
  );
}

function CircleLabel({ circle, i }: { circle: Circle; i: number }) {
  const isCategoryCircle = circle.data.label.includes("Category");

  return (
    <motion.text
      key={
        isCategoryCircle
          ? Math.random()
          : `text-${circle.data.label}-${circle.data.id}`
      }
      initial={{
        opacity: 0,
        scale: 0,
        x: circle.x,
        y: circle.y,
        fontSize: circle.r * 0.2,
      }}
      exit={{
        opacity: 0,
        scale: 0,
        transition: { duration: 0.1 },
      }}
      animate={{
        scale: 1,
        opacity: 1,
        x: circle.x,
        y: circle.y,
        fontSize: circle.r * 0.2,
      }}
      transition={{
        type: "spring",
        damping: 20,
        stiffness: 100,
        ...(isCategoryCircle ? { delay: 0.6 } : {}),
      }}
      fill={"black"}
      textAnchor="middle"
      dominantBaseline="middle"
    >
      {circle.data.label}
    </motion.text>
  );
}

export default function Home() {
  const [currentLens, setCurrentLens] = React.useState<string | undefined>(
    "Categorical 1"
  );

  const currentLensData =
    newMockData.lenses.find((lens) => lens.label === currentLens) ||
    newMockData.lenses[0];

  return (
    <main className="absolute w-full h-full left-0 top-0">
      {newMockData.lenses.map((lens) => (
        <button
          key={lens.label}
          value={lens.label}
          className={`${
            currentLens === lens.label ? "border-pink-500" : ""
          } mr-4 border border-gray-800 p-2`}
          onClick={() => setCurrentLens(lens.label)}
        >
          {lens.label}
        </button>
      ))}

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
