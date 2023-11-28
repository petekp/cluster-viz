"use client";

// This prototype demonstrates a circle pack visualization with a continuous and categorical lenses. The categorical lenses support showing multiple entities across all segments.

import React from "react";
import ParentSize from "@visx/responsive/lib/components/ParentSize";

import { Group } from "@visx/group";
import { Pack, hierarchy } from "@visx/hierarchy";
import { scaleQuantile } from "@visx/scale";
import { LegendQuantile } from "@visx/legend";
import { localPoint } from "@visx/event";

import {
  CategoricalLens,
  ContinuousLens,
  LandscapeVisualization,
  Segment,
  generateMockData,
} from "./mockData";
import { AnimatePresence, motion } from "framer-motion";
import { useTooltip, useTooltipInPortal } from "@visx/tooltip";

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
  showTooltip: (event: any) => void;
  hideTooltip: () => void;
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
  showTooltip,
  hideTooltip,
}: LandscapeVizProps) {
  type Datum = Segment & { children: any };
  const isContinuous = currentLens.type === "continuous";
  const isCategorical = currentLens.type === "categorical";

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
        className="p-3 rounded-md bg-black bg-opacity-50 backdrop-blur-md"
        style={{
          position: "absolute",
          bottom: 12,
          right: 12,
          zIndex: 999,
        }}
        labelTransform={({ scale, labelFormat }) =>
          (d, i) => {
            const [x0, x1] = scale.invertExtent(scale(d));
            const formattedX0 = labelFormat(
              Math.floor(x0),
              i
            )?.toLocaleString();
            const formattedX1 = labelFormat(
              Math.floor(x1),
              i
            )?.toLocaleString();
            return {
              datum: d,
              index: i,
              text: `${formattedX0} – ${formattedX1}`,
              value: scale(d),
            };
          }}
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
                  <AnimatePresence>
                    {circles.map((circle, i) => {
                      const segment = lensSegments.find(
                        (segment) => segment.id === circle.data.id
                      ) as ContinuousLens["segments"][0];

                      const isCategoryCircle =
                        circle.data.label.includes("Category");

                      const fill = isContinuous
                        ? colorScale?.(segment.mean)
                        : colorScale(circle.data.count);

                      return (
                        <>
                          <motion.circle
                            onMouseOver={(event: any, datum: any) => {
                              const eventSvgCoords = localPoint(event);

                              showTooltip({
                                tooltipData: circle.data,
                                tooltipTop: eventSvgCoords?.y,
                                tooltipLeft: circle.x,
                              });
                            }}
                            onMouseOut={hideTooltip}
                            key={
                              isCategoryCircle
                                ? Math.random()
                                : `circle-${circle.data.label}-${circle.data.id}-${i}`
                            }
                            r={circle.r}
                            cx={circle.x}
                            initial={{
                              fill,
                              ...(isCategoryCircle
                                ? { opacity: 0, scale: 0 }
                                : { opacity: 0, scale: 0.5 }),
                            }}
                            exit={{ opacity: 0, scale: 0, fill: "red" }}
                            cy={circle.y}
                            strokeWidth={0.2}
                            stroke={isCategoryCircle ? "white" : "none"}
                            transition={{
                              type: "spring",
                              damping: 18,
                              stiffness: 100,
                              ...(isCategoryCircle ? { delay: 0.37 } : {}),
                            }}
                            animate={{
                              scale: 1,
                              opacity: 1,
                              ...(!isCategoryCircle
                                ? { cx: circle.x, cy: circle.y }
                                : {}),
                              r: circle.r,
                              fill: fill,
                            }}
                            fill={fill}
                          />
                        </>
                      );
                    })}
                  </AnimatePresence>
                </Group>
                <Group transform={`translate(${0}, ${0})`}>
                  {circles.map((circle, i) => {
                    return (
                      <CircleLabel
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

const CircleLabel = React.memo(
  function CircleLabel({
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
    const aboveCirclePos = circle.y - circle.r - 12;
    const targetY = isCategoricalLabel ? aboveCirclePos : circle.y;
    const opacity = 1;
    const scale = isCategoricalLabel ? 0.6 : 1;
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
          key={
            isCategoryCircle
              ? Math.random()
              : `text-label-${circle.data.label}-${circle.data.id}-${i}`
          }
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
            ...(isCategoryCircle ? { delay: 0.6 } : {}),
          }}
          fill="white"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {circle.data.label}
        </motion.text>
      </>
    );
  },
  (prevProps, nextProps) => {
    return false;
  }
);

export default function Home() {
  const [currentLens, setCurrentLens] = React.useState<string | undefined>(
    "Categorical 1"
  );

  const currentLensData =
    newMockData.lenses.find((lens) => lens.label === currentLens) ||
    newMockData.lenses[0];

  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip();

  // If you don't want to use a Portal, simply replace `TooltipInPortal` below with
  // `Tooltip` or `TooltipWithBounds` and remove `containerRef`
  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    // use TooltipWithBounds
    detectBounds: true,
    // when tooltip containers are scrolled, this will correctly update the Tooltip position
    scroll: true,
  });

  return (
    <main className="w-full h-full flex">
      <div className="flex flex-col  flex-shrink-0 p-4">
        {newMockData.lenses.map((lens) => (
          <button
            key={lens.label}
            value={lens.label}
            className={`${
              currentLens === lens.label ? "border-pink-500" : ""
            } border border-gray-800 p-2`}
            onClick={() => setCurrentLens(lens.label)}
          >
            {lens.label}
          </button>
        ))}
      </div>
      <div className="flex flex-1 ">
        <>
          <ParentSize>
            {({ width, height }) => (
              <LandscapeViz
                width={width}
                height={height}
                currentLens={currentLensData}
                showTooltip={showTooltip}
                hideTooltip={hideTooltip}
              />
            )}
          </ParentSize>
          {tooltipOpen && (
            <TooltipInPortal
              top={tooltipTop}
              left={tooltipLeft}
              className="p-2"
            >
              <div className="mb-1">
                <strong>{tooltipData?.label}</strong>
              </div>
              <div>Data will go here</div>
              <div></div>
            </TooltipInPortal>
          )}
        </>
      </div>
    </main>
  );
}
