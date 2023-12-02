"use client";

// This prototype demonstrates a circle pack visualization with a continuous and categorical lenses. The categorical lenses support showing a SINGLE entity across all segments.

// The visualization is controlled through the table on the left. The table supports sorting and filtering. The table also supports selecting a lens and a category. The visualization will update to reflect the selected lens and category.

import React, { Fragment } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ParentSize from "@visx/responsive/lib/components/ParentSize";
import { Group } from "@visx/group";
import { Pack } from "@visx/hierarchy";
import { scaleSqrt } from "@visx/scale";
import { LegendQuantile } from "@visx/legend";
import { colord } from "colord";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import {
  createColumnHelper,
  flexRender,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";

import {
  ContinuousLens,
  LandscapeVisualization,
  Segment,
  generateMockData,
} from "./mockData";
import { debounce } from "lodash";
import { LensProvider, useLensDispatch, useLensState } from "./LensContext";
import usePreparedData from "./usePreparedData";
import useColorScale from "./useColorScale";

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

export type Datum = Segment & { children: Segment[]; value: number };

function LandscapeViz({ width, height, data }: LandscapeVizProps) {
  const { activeLens, activeCategory } = useLensState();
  const { preparedData, root } = usePreparedData({
    data,
    activeLens,
    activeCategory,
  });

  const values = preparedData.children.map((child) => child.value);

  const colorScale = useColorScale(values);

  return width < 10 ? null : (
    <>
      <LegendQuantile
        scale={colorScale}
        className="p-3 rounded-md bg-black bg-opacity-50 backdrop-blur-md text-xs"
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 999,
        }}
        labelTransform={transformlabel}
      />

      <motion.svg width="100%" height="100%" viewBox={`0 0 600 500`} preserveAspectRatio="xMidYMid meet">
        <Pack<Datum> root={root} size={[600, 500]} padding={10}>
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

    console.log(mockData);

    setData(mockData);
  }, [numSegments]);

  if (!data) {
    return null;
  }

  return (
    <LensProvider>
      <main className="flex h-full w-full gap-4 p-5">
        <PanelGroup direction="horizontal">
          <Panel minSizePercentage={25}>
            <div className="flex flex-col justify-center">
              <SegmentsTable data={data} />
              <div className="mt-4 flex max-w-xl flex-col">
                <label htmlFor="numSegments">
                  Mock segments: {numSegments}
                </label>
                <input
                  type="range"
                  id="numSegments"
                  name="numSegments"
                  min="1"
                  max="100"
                  value={numSegments}
                  onChange={(e) =>
                    debouncedSetNumSegments(Number(e.target.value))
                  }
                />
              </div>
            </div>
          </Panel>
          <PanelResizeHandle className="w-2 rounded-full bg-gray-900 transition-all hover:bg-gray-700" />
          <Panel minSizePercentage={25}>
            <ParentSize>
              {({ width, height }) => (
                <LandscapeViz data={data} width={width} height={height} />
              )}
            </ParentSize>
          </Panel>
        </PanelGroup>
      </main>
    </LensProvider>
  );
}

function SegmentsTable({ data }: { data: LandscapeVisualization }) {
  const { selectedCategories, activeCategory, activeLens } = useLensState();
  const { preparedData } = usePreparedData({
    data,
    activeCategory,
    activeLens,
  });
  const [activeColumnId, setActiveColumnId] = React.useState<string | null>(
    null
  );

  const values = preparedData.children.map((child) => child.value);

  const colorScale = useColorScale(values);

  const dispatch = useLensDispatch();

  const tableData = React.useMemo(() => prepareTableData(data), [data]);
  const columnHelper = createColumnHelper<any>();
  const columns = React.useMemo(() => {
    const baseColumns = [
      columnHelper.accessor("label", {
        header: (ctx) => {
          return (
            <button
              className="flex select-none min-w-[100px]"
              onClick={() => {
                ctx.column.toggleSorting();
                setActiveColumnId(ctx.column.id);
                dispatch({
                  type: "SET_ACTIVE_LENS",
                  payload: null,
                });
                dispatch({
                  type: "SET_ACTIVE_LENS_CATEGORY",
                  payload: null,
                });
              }}
            >
              Segment
              <span className="text-pink-500 ml-2">
                {{
                  asc: " ↑",
                  desc: " ↓",
                }[ctx.column.getIsSorted() as string] ?? " "}
              </span>
            </button>
          );
        },
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("count", {
        header: (ctx) => {
          return (
            <button
              className="flex select-none"
              onClick={() => {
                ctx.column.toggleSorting();
                setActiveColumnId(ctx.column.id);
                dispatch({
                  type: "SET_ACTIVE_LENS",
                  payload: null,
                });
                dispatch({
                  type: "SET_ACTIVE_LENS_CATEGORY",
                  payload: null,
                });
              }}
            >
              Count
              <span className="text-pink-500 ml-2">
                {{
                  asc: " ↑",
                  desc: " ↓",
                }[ctx.column.getIsSorted() as string] ?? " "}
              </span>
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
        header: (ctx) =>
          lens.type === "continuous" ? (
            <div
              onClick={() => {
                dispatch({
                  type: "SET_ACTIVE_LENS",
                  payload: lens.label,
                });
                dispatch({
                  type: "SET_ACTIVE_LENS_CATEGORY",
                  payload: null,
                });
                ctx.column.toggleSorting();
                setActiveColumnId(ctx.column.id);
              }}
              className="cursor-pointer flex flex-col items-end justify-start gap-1 select-none flex-shrink-0"
            >
              <div className="flex flex-shrink-0">
                {lens.label}
                <span className="text-pink-500">
                  {{
                    asc: " ↑",
                    desc: " ↓",
                  }[ctx.column.getIsSorted() as string] ?? " "}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div
                className="cursor-pointer flex flex-col items-end justify-start gap-1 select-none flex-shrink-0"
                onClick={() => {
                  ctx.column.toggleSorting();
                  setActiveColumnId(ctx.column.id);
                }}
              >
                {lens.label}
                <span className="text-pink-500 ml-2">
                  {{
                    asc: " ↑",
                    desc: " ↓",
                  }[ctx.column.getIsSorted() as string] ?? " "}
                </span>
              </div>
              <select
                className="text-black text-xs"
                value={selectedCategories[lens.label] || ""}
                onChange={(e) => {
                  setActiveColumnId(ctx.column.id);
                  dispatch({
                    type: "SET_ACTIVE_LENS",
                    payload: lens.label,
                  });
                  dispatch({
                    type: "SET_ACTIVE_LENS_CATEGORY",
                    payload: e.target.value,
                  });
                  console.log(selectedCategories);
                  dispatch({
                    type: "SET_SELECTED_CATEGORY_FOR_LENS",
                    payload: {
                      lens: lens.label,
                      category: e.target.value,
                    },
                  });
                }}
              >
                {lens.segments[0].categories.map((category, index) => (
                  <option
                    key={`${category.label}-${index}`}
                    value={category.label}
                  >
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          ),
        cell:
          lens.type === "categorical"
            ? (info) => {
                const lensData = lens.segments.find(
                  (s) => s.id === info.row.original.id
                );
                const categoryData = lensData?.categories.find(
                  (c) => c.label === selectedCategories[lens.label]
                );
                const cellData = categoryData || lensData?.categories[0];
                return cellData?.count.toLocaleString() || 0;
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
    initialState: {
      sorting: [
        {
          id: "count",
          desc: true,
        },
      ],
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSorting: true,
  });

  return (
    <div className="flex flex-col max-w-[50vw] overflow-scroll bg-gray-900 rounded-2xl">
      <table className="text-xs">
        <thead className="sticky-header">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  className={`${
                    header.id === activeColumnId
                      ? "bg-gray-800 sticky-column"
                      : ""
                  } p-2 text-left bg-gray-900`}
                  key={header.id}
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
        <AnimatePresence>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  console.log(cell.getValue());
                  const isActiveCol = cell.column.id === activeColumnId;
                  const cellValue = cell.getValue();
                  const backgroundColor =
                    typeof cellValue === "number"
                      ? colord(colorScale(cellValue))
                          .desaturate(isActiveCol ? 0.2 : 0.4)
                          .darken(isActiveCol ? 0.2 : 0.3)
                          .toHex()
                      : "rgba(0,0,0,0)";

                  const borderColor = colord(backgroundColor)
                    .lighten(0.12)
                    .toHex();

                  return (
                    <motion.td
                      key={cell.id}
                      initial={{
                        backgroundColor,
                      }}
                      animate={{
                        backgroundColor,
                      }}
                      style={{
                        backgroundColor,
                        borderBottomColor: borderColor,
                      }}
                      className={` tabular-nums p-2 border-b border-gray-800 ${
                        typeof cell.getValue() === "number"
                          ? "text-right"
                          : "text-left"
                      } ${
                        cell.column.id === activeColumnId
                          ? "bg-gray-800 sticky-column border-gray-700"
                          : ""
                      }`}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </motion.td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </AnimatePresence>
      </table>
    </div>
  );
}
