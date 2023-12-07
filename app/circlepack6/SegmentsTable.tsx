import { AnimatePresence, motion } from "framer-motion";
import { scaleQuantile } from "@visx/scale";
import { useMemo, useState } from "react";
import { colord } from "colord";
import {
  CellContext,
  HeaderContext,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { useLensDispatch, useLensState } from "./LensContext";
import { usePreparedTableData } from "./usePreparedData";
import { colorScaleRange } from "./animation";
import {
  CategoricalLens,
  ContinuousLens,
  LandscapeVisualization,
} from "./mockData";

export default function SegmentsTable({
  data,
}: {
  data: LandscapeVisualization;
}) {
  const { selectedCategories, activeCategory, activeLens } = useLensState();
  const dispatch = useLensDispatch();
  const { tableData, columnMinMax } = useMemo(
    () => usePreparedTableData(data),
    [data],
  );
  const columnHelper = createColumnHelper<any>();
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);

  const colorScales: Record<
    string,
    Record<string, (value: number) => string>
  > = {};

  Object.entries(columnMinMax).forEach(([lensLabel, categories]) => {
    const lens = data.lenses.find((lens) => lens.label === lensLabel);
    colorScales[lensLabel] = createColorScale(lens, categories);
  });

  function renderLabelHeader(ctx: HeaderContext<any, any>) {
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
        <span className="ml-2 text-pink-500">
          {{
            asc: " ↑",
            desc: " ↓",
          }[ctx.column.getIsSorted() as string] ?? " "}
        </span>
      </button>
    );
  }

  function renderLabelCell(info: CellContext<any, any>) {
    return info.getValue().toLocaleString();
  }

  function renderCountHeader(ctx: HeaderContext<any, any>) {
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
        <span className="ml-2 text-pink-500">
          {{
            asc: " ↑",
            desc: " ↓",
          }[ctx.column.getIsSorted() as string] ?? " "}
        </span>
      </button>
    );
  }

  function renderCountCell(info: CellContext<any, any>) {
    return info.getValue().toLocaleString();
  }

  function renderContinuousLensHeader(
    ctx: HeaderContext<any, any>,
    lens: ContinuousLens,
  ) {
    return (
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
        className="flex flex-shrink-0 cursor-pointer select-none flex-col items-end justify-start gap-1"
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
    );
  }

  function getCellColors({
    color,
    isActive,
  }: {
    color: string;
    isActive: boolean;
  }) {
    const backgroundColor = colord(color)
      .desaturate(isActive ? 0.2 : 0.4)
      .darken(isActive ? 0.2 : 0.3)
      .toHex();

    const borderColor = colord(backgroundColor).lighten(0.12).toHex();
    return { backgroundColor, borderColor };
  }

  function renderContinuousLensCell(
    info: CellContext<any, any>,
    lens: ContinuousLens,
  ) {
    const lensData = lens.segments.find((s) => s.id === info.row.original.id);
    const isActiveCol = activeColumnId === info.cell.column.id;

    const { backgroundColor, borderColor } = getCellColors({
      color: colorScales[lens.label](lensData?.mean),
      isActive: isActiveCol,
    });

    return (
      <div
        className=" flex h-4 border-b"
        style={{ backgroundColor, borderColor }}
      >
        {info.getValue().toLocaleString()}
      </div>
    );
  }

  function renderCategoricalLensHeader(
    ctx: HeaderContext<any, any>,
    lens: CategoricalLens,
  ) {
    return (
      <div className="flex flex-col gap-1">
        <div
          className="flex flex-shrink-0 cursor-pointer select-none flex-col items-end justify-start gap-1"
          onClick={() => {
            ctx.column.toggleSorting();
            setActiveColumnId(ctx.column.id);
          }}
        >
          {lens.label}
          <span className="ml-2 text-pink-500">
            {{
              asc: " ↑",
              desc: " ↓",
            }[ctx.column.getIsSorted() as string] ?? " "}
          </span>
        </div>
        <select
          className="text-xs text-black"
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
            <option key={`${category.label}-${index}`} value={category.label}>
              {category.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  function renderCategoricalLensCell(
    info: CellContext<any, any>,
    lens: CategoricalLens,
  ) {
    const isActiveCol = info.cell.column.id === activeColumnId;

    const lensData = lens.segments.find((s) => s.id === info.row.original.id);
    const categoryData = lensData?.categories.find(
      (c) => c.label === selectedCategories[lens.label],
    );
    const cellData = categoryData || lensData?.categories[0];

    const { backgroundColor, borderColor } = getCellColors({
      color: colorScales[lens.label][cellData.label](cellData.count),
      isActive: isActiveCol,
    });

    return (
      <div
        className=" flex h-4 border-b"
        style={{ backgroundColor, borderColor }}
      >
        {cellData?.count.toLocaleString() || 0}
      </div>
    );
  }

  const columns = useMemo(() => {
    const baseColumns = [
      columnHelper.accessor("label", {
        header: renderLabelHeader,
        cell: renderLabelCell,
        sortingFn: "auto",
        enableSorting: true,
      }),
      columnHelper.accessor("count", {
        header: renderCountHeader,
        cell: renderCountCell,
        sortingFn: "auto",
        enableSorting: true,
      }),
    ];

    const lensColumns = data.lenses.map((lens) =>
      columnHelper.accessor(lens.label, {
        header: (ctx) =>
          lens.type === "continuous"
            ? renderContinuousLensHeader(ctx, lens)
            : renderCategoricalLensHeader(ctx, lens),
        cell: (info) =>
          lens.type === "categorical"
            ? renderCategoricalLensCell(info, lens)
            : renderContinuousLensCell(info, lens),
        sortingFn: "auto",
        enableSorting: true,
      }),
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
    enableSorting: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="flex max-w-[50vw] flex-col overflow-scroll rounded-2xl bg-gray-900">
      <table className="text-xs">
        <thead className="sticky-header">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  className={`${
                    header.id === activeColumnId
                      ? "sticky-column bg-gray-800"
                      : ""
                  } bg-gray-900 p-2 text-left`}
                  key={header.id}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
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
                  return (
                    <motion.td
                      key={cell.id}
                      className={` border-b border-gray-800  tabular-nums ${
                        typeof cell.getValue() === "number"
                          ? "text-right"
                          : "text-left"
                      } ${
                        cell.column.id === activeColumnId
                          ? "sticky-column border-gray-700 bg-gray-800"
                          : ""
                      }`}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
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

function createColorScale(lens: any, categories: any) {
  if (lens.type === "continuous") {
    return scaleQuantile({
      domain: [categories.min, categories.max],
      range: colorScaleRange,
    });
  } else {
    const colorScale: Record<string, (value: number) => string> = {};
    Object.entries(categories).forEach(([categoryLabel, { min, max }]) => {
      colorScale[categoryLabel] = scaleQuantile({
        domain: [min, max],
        range: colorScaleRange,
      });
    });
    return colorScale;
  }
}
