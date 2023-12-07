import { Pack } from "@visx/hierarchy";
import { Group } from "@visx/group";
import { Fragment } from "react";
import { colord } from "colord";

import { LandscapeVisualization, Segment } from "./mockData";
import { usePreparedVizData } from "./usePreparedData";
import { useLensState } from "./LensContext";
import CircleLabel from "./CircleLabel";
import Circle from "./Circle";
import Legend from "./Legend";
import { scaleQuantile } from "@visx/scale";
import { colorScaleRange } from "./config";

export type LandscapeVizProps = {
  width: number;
  height: number;
  data: LandscapeVisualization;
  margin?: { top: number; right: number; bottom: number; left: number };
};

export type Datum = Segment & { children: Segment[]; value: number };

function getColorScaleDomain(
  activeLens: string | null,
  activeCategory: string | null,
  data: LandscapeVisualization,
): [number, number] {
  const lensData = data.lenses.find((lens) => lens.label === activeLens);

  if (lensData?.type === "continuous") {
    const continuousLensData = lensData as ContinuousLens;
    return [continuousLensData.min, continuousLensData.max];
  } else if (lensData?.type === "categorical") {
    const categoricalLensData = lensData as CategoricalLens;
    const categoryData = categoricalLensData.categories.find(
      (category) => category.label === activeCategory,
    );
    return [categoryData?.min ?? 0, categoryData?.max ?? 0];
  }

  return [0, 1]; // Default domain
}

function getColorScaleValues(
  activeLens: string | null,
  activeCategory: string | null,
  data: LandscapeVisualization,
  lensValues: Record<string, number>,
): number[] {
  if (activeLens && activeCategory) {
    return data.segments.map((segment) => {
      const lensData = segment.lenses.find((lens) => lens.label === activeLens);
      if (lensData?.type === "categorical") {
        const categoryData = lensData.categories.find(
          (category) => category.label === activeCategory,
        );
        return categoryData?.count ?? 0;
      }
      return lensValues[segment.id];
    });
  }

  return Object.values(lensValues); // Default values
}

export default function LandscapeViz({
  width,
  height,
  data,
}: LandscapeVizProps) {
  const { activeLens, activeCategory } = useLensState();
  const { root, lensValues } = usePreparedVizData(data);

  return width < 10 ? null : (
    <>
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 999 }}>
        {/* <Legend colorScale={colorScale} /> */}
      </div>

      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 600 500`}
        preserveAspectRatio="xMidYMid meet"
      >
        <Pack<Datum> root={root} size={[600, 500]} padding={10}>
          {(packData) => {
            const circles = packData.descendants().slice(1);

            const activeKey = activeCategory
              ? `${activeLens}-${activeCategory}`
              : activeLens
                ? activeLens
                : "default";

            return (
              <>
                <Group transform={`translate(${0}, ${0})`}>
                  {circles.map((circle) => {
                    const lensValue =
                      lensValues[activeKey][circle.data.id].value;
                    const fill = lensValues[activeKey][circle.data.id].color;
                    const isFillLight = colord(fill).isLight();
                    const lightFill = colord(fill).lighten(0.8).toHex();
                    const darkFill = colord(fill).darken(0.8).toHex();
                    const labelColor = isFillLight ? darkFill : lightFill;
                    const innerCircleRadius = lensValue * circle.r;

                    console.log(fill);

                    return (
                      <Fragment key={`circle-${circle.data.id}`}>
                        <Circle
                          key={`outer-${circle.data.id}`}
                          r={circle.r}
                          x={circle.x}
                          y={circle.y}
                          fill="transparent"
                          stroke={fill}
                          strokeWidth={1.5}
                        />
                        <Circle
                          key={`inner-${circle.data.id}`}
                          r={innerCircleRadius}
                          x={circle.x}
                          y={circle.y}
                          fill={fill}
                        />
                        <CircleLabel
                          key={`label-${circle.data.id}`}
                          label={circle.data.label}
                          r={circle.r}
                          x={circle.x}
                          y={circle.y}
                          color={labelColor}
                        />
                      </Fragment>
                    );
                  })}
                </Group>
              </>
            );
          }}
        </Pack>
      </svg>
    </>
  );
}
