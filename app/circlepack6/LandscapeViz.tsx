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

export type LandscapeVizProps = {
  width: number;
  height: number;
  data: LandscapeVisualization;
  margin?: { top: number; right: number; bottom: number; left: number };
};

export type Datum = Segment & { children: Segment[]; value: number };

export default function LandscapeViz({
  width,
  height,
  data,
}: LandscapeVizProps) {
  const { activeLens, activeCategory } = useLensState();
  const { hierarchy, lensValues, colorScales } = usePreparedVizData(data);
  console.log({ colorScales });

  const lensKey = activeCategory
    ? `${activeLens}-${activeCategory}`
    : activeLens
      ? activeLens
      : "default";

  console.log(colorScales[lensKey]);

  return width < 10 ? null : (
    <>
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 999 }}>
        <Legend colorScale={colorScales[lensKey]} />
      </div>

      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 600 500`}
        preserveAspectRatio="xMidYMid meet"
      >
        <Pack<Datum> root={hierarchy} size={[600, 500]} padding={10}>
          {(packData) => {
            const circles = packData.descendants().slice(1);

            return (
              <>
                <Group transform={`translate(${0}, ${0})`}>
                  {circles.map((circle) => {
                    const segmentKey = circle.data.id;

                    const { value, color } = lensValues[lensKey][segmentKey];

                    const isFillLight = colord(color).isLight();
                    const lightFill = colord(color).lighten(0.8).toHex();
                    const darkFill = colord(color).darken(0.8).toHex();
                    const labelColor = isFillLight ? darkFill : lightFill;
                    const innerCircleRadius = value * circle.r;

                    return (
                      <Fragment key={`circle-${circle.data.id}`}>
                        <Circle
                          key={`outer-${circle.data.id}`}
                          r={circle.r}
                          x={circle.x}
                          y={circle.y}
                          fill="transparent"
                          stroke={color}
                          strokeWidth={1.5}
                        />
                        <Circle
                          key={`inner-${circle.data.id}`}
                          r={innerCircleRadius}
                          x={circle.x}
                          y={circle.y}
                          fill={color}
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
