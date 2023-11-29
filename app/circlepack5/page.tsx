"use client";

// This prototype demonstrates a circle pack visualization with a continuous and categorical lenses. The categorical lenses support showing a SINGLE entity across all segments.

// The visualization is controlled through the table on the left. The table supports sorting and filtering. The table also supports selecting a lens and a category. The visualization will update to reflect the selected lens and category.

import React, { Fragment } from "react";
import { motion } from "framer-motion";
import ParentSize from "@visx/responsive/lib/components/ParentSize";
import { Group } from "@visx/group";
import { Pack, hierarchy } from "@visx/hierarchy";
import { scaleQuantile, scaleSqrt } from "@visx/scale";
import { LegendQuantile } from "@visx/legend";
import { colord } from "colord";
import {
  createColumnHelper,
  flexRender,
  useReactTable,
  getCoreRowModel,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";

import {
  CategoricalLens,
  ContinuousLens,
  LandscapeVisualization,
  Segment,
  generateMockData,
} from "./mockData";
import { debounce } from "lodash";
import { LensProvider, useLensDispatch, useLensState } from "./LensContext";

function extent<D>(allData: D[], value: (d: D) => number): [number, number] {
  return [Math.min(...allData.map(value)), Math.max(...allData.map(value))];
}
const colorRange2 = ["#3900DC", "#6D29FF", "#AB00FC", "#E40089", "#FF1D38"];

const transitionConfig = {
  type: "spring",
  damping: 2,
  mass: 0.2,
  stiffness: 5,
};

function prepareTableData(data: LandscapeVisualization) {
  return data.segments.map((segment) => {
    const row: any = {
      id: segment.id,
      label: segment.label,
      count: segment.count,
    };

    data.lenses.forEach((lens) => {
      if (lens.type === "continuous") {
        const lensData = lens.segments.find((s) => s.id === segment.id);
        if (lensData) {
          row[lens.label] = lensData.mean;
        }
      } else if (lens.type === "categorical") {
        const lensData = lens.segments.find((s) => s.id === segment.id);
        if (lensData) {
          row[lens.label] = lensData.categories.map((c) => c.label).join(", ");
        }
      }
    });

    return row;
  });
}

function prepareLensData({
  data,
  activeCategory,
  activeLensData,
}: {
  data: LandscapeVisualization;
  activeCategory: string | null;
  activeLensData: CategoricalLens | ContinuousLens | undefined;
}) {
  if (
    activeLensData &&
    activeLensData.type === "categorical" &&
    activeCategory
  ) {
    const maxCount = Math.max(
      ...activeLensData.segments.map(
        (segment) =>
          segment.categories.find((c) => c.label === activeCategory)?.count || 0
      )
    );

    return {
      id: "root",
      label: "root",
      description: "",
      count: 0,
      value: 0,
      children: data.segments.map((segment) => {
        const matchingSegment = activeLensData.segments.find(
          (s) => s.id === segment.id
        );
        const matchingCategory = matchingSegment?.categories.find(
          (c) => c.label === activeCategory
        );
        const value = matchingCategory
          ? (matchingCategory.count / maxCount) * segment.count
          : 0;
        return {
          ...segment,
          value,
        };
      }),
    };
  }

  if (activeLensData && activeLensData.type === "continuous") {
    return {
      id: "",
      children: data.segments.map((segment) => {
        const matchingSegment = activeLensData.segments.find(
          (s) => s.id === segment.id
        );
        return {
          ...segment,
          value: matchingSegment ? matchingSegment.mean : 0,
        };
      }),
      label: "root",
      description: "",
      count: 0,
      value: 0,
    };
  }

  return {
    id: "root",
    children: data.segments.map((segment) => ({
      ...segment,
      value: segment.count,
    })),
    label: "",
    description: "",
    count: 0,
    value: 0,
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

type Circle = {
  x: number;
  y: number;
  r: number;
  data: {
    label: string;
    id: string;
  };
};

export type LandscapeVizProps = {
  width: number;
  height: number;
  data: LandscapeVisualization;
  margin?: { top: number; right: number; bottom: number; left: number };
};

type Datum = Segment & { children: Segment[]; value: number };

function LandscapeViz({ width, height, data }: LandscapeVizProps) {
  const { activeLens, activeCategory } = useLensState();

  const activeLensData = React.useMemo(() => {
    return data.lenses.find((lens) => lens.label === activeLens);
  }, [data, activeLens, activeCategory]);

  const preparedData = React.useMemo(() => {
    return prepareLensData({ data, activeLensData, activeCategory });
  }, [data, activeLensData, activeCategory]);

  const root = React.useMemo(() => {
    return hierarchy<Datum>(preparedData)
      .sum((d) => d.count)
      .sort((a, b) => {
        return b.data.count - a.data.count;
      });
  }, [preparedData, activeCategory, activeLens]);

  const colorScale = React.useMemo(() => {
    let domain: [number, number] = [0, 0];

    if (activeCategory) {
      domain = extent(preparedData.children, (segment) => segment.value);
    } else {
      const lens = data.lenses.find((lens) => lens.label === activeLens);
      if (lens && lens.type === "continuous") {
        domain = extent(lens.segments, (s) => s.mean);
      } else {
        domain = extent(data.segments, (s) => s.count);
      }
    }

    return scaleQuantile({
      domain,
      range: colorRange2,
    });
  }, [preparedData]);

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
            const lens = data.lenses.find((lens) => lens.label === activeLens);
            const lensSegments = lens ? lens.segments : [];

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

                    const fill =
                      activeCategory || !segment
                        ? colorScale(circle.data.count)
                        : colorScale(segment.mean);

                    const isFillLight = colord(fill).isLight();
                    const lightFill = colord(fill).lighten(0.8).toHex();
                    const darkFill = colord(fill).darken(0.8).toHex();
                    const labelColor = isFillLight ? darkFill : lightFill;

                    if (!circle.r || !circle.x || !circle.y) {
                      return null;
                    }

                    let innerCircleRadius;
                    if (!activeLens) {
                      innerCircleRadius = circle.r;
                    } else if (!activeCategory) {
                      innerCircleRadius =
                        (segment.mean / segment.max) * circle.r;
                    } else {
                      // Use a square root scale for the inner circle radius
                      const sqrtScale = scaleSqrt({
                        domain: [
                          0,
                          Math.max(
                            ...preparedData.children.map((d) => d.value)
                          ),
                        ],
                        range: [0, circle.r],
                      });
                      innerCircleRadius = sqrtScale(circle.data.value);
                    }

                    return (
                      <Fragment key={`circle-${i}`}>
                        <defs key={`inner-stroke-${i}`}>
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
                          key={`circle-segment-outer-${circle.data.label}`}
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
                      </Fragment>
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
            radius="1"
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

  return (
    <LensProvider>
      <main className="w-full h-full flex">
        <div className="flex flex-col  flex-shrink-0 p-4">
          <div className="flex flex-col mb-4">
            <label htmlFor="numSegments"># segments {numSegments}</label>
            <input
              type="range"
              id="numSegments"
              name="numSegments"
              min="1"
              max="100"
              value={numSegments}
              onChange={(e) => debouncedSetNumSegments(Number(e.target.value))}
            />
          </div>

          <SegmentsTable data={data} />
        </div>
        <div className="flex flex-1 ">
          <>
            <ParentSize>
              {({ width, height }) => (
                <LandscapeViz data={data} width={width} height={height} />
              )}
            </ParentSize>
          </>
        </div>
      </main>
    </LensProvider>
  );
}

function SegmentsTable({ data }: { data: LandscapeVisualization }) {
  const { activeLens, activeCategory } = useLensState();
  const [activeColumnId, setActiveColumnId] = React.useState<string | null>(
    null
  );

  console.log(activeColumnId);

  const dispatch = useLensDispatch();

  const tableData = React.useMemo(() => prepareTableData(data), [data]);
  const columnHelper = createColumnHelper<any>();
  const columns = React.useMemo(() => {
    const baseColumns = [
      columnHelper.accessor("label", {
        header: (ctx) => {
          return (
            <button
              className="h-8 flex flex-col"
              onClick={() => {
                ctx.column.toggleSorting();
              }}
            >
              Label
            </button>
          );
        },
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("count", {
        header: (ctx) => {
          return (
            <button
              className="h-8 flex flex-col"
              onClick={() => ctx.column.toggleSorting()}
            >
              Count
            </button>
          );
        },
        cell: (info) => {
          return info.getValue().toLocaleString();
        },
        sortingFn: "auto",
        enableSorting: true,
      }),
    ];

    const lensColumns = data.lenses.map((lens) =>
      columnHelper.accessor(lens.label, {
        header: (ctx) => (
          <div
            onClick={() => {
              if (lens.type === "continuous") {
                dispatch({
                  type: "SET_ACTIVE_LENS",
                  payload: lens.label,
                });
                dispatch({
                  type: "SET_ACTIVE_LENS_CATEGORY",
                  payload: null,
                });
              }
            }}
            className="cursor-pointer flex flex-col h-8 hover:bg-gray-800 active:bg-gray-600 mr-2"
            style={{ cursor: "pointer" }}
          >
            {lens.type !== "categorical" ? lens.label : null}
            {lens.type === "categorical" && (
              <select
                className="text-black text-xs"
                value={activeLens === lens.label ? activeCategory! : ""}
                onChange={(e) => {
                  dispatch({
                    type: "SET_ACTIVE_LENS",
                    payload: lens.label,
                  });
                  dispatch({
                    type: "SET_ACTIVE_LENS_CATEGORY",
                    payload: e.target.value,
                  });
                }}
              >
                <option disabled value="">
                  {lens.label}
                </option>
                {lens.segments[0].categories.map((category, index) => (
                  <option
                    key={`${category.label}-${index}`}
                    value={category.label}
                  >
                    {category.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        ),
        cell:
          lens.type === "categorical"
            ? (info) => {
                const lensData = lens.segments.find(
                  (s) => s.id === info.row.original.id
                );
                const categoryData = lensData?.categories.find(
                  (c) => c.label === activeCategory
                );
                return categoryData?.count.toLocaleString() || 0;
              }
            : (info) => info.getValue().toLocaleString(),
        enableSorting: true,
      })
    );

    return [...baseColumns, ...lensColumns];
  }, [data, columnHelper, dispatch]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSorting: true,
  });

  return (
    <table className="text-sm">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th
                className={`${
                  header.id === activeColumnId ? "bg-red-600" : ""
                } p-2 text-left`}
                key={header.id}
                onClick={() => {
                  header.column.toggleSorting();
                  setActiveColumnId(header.column.id);
                }}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                className="tabular-nums p-2 border-b border-gray-800"
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
