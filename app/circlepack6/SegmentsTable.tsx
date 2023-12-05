export default function SegmentsTable({
  data,
}: {
  data: LandscapeVisualization;
}) {
  const { activeLens, activeCategory, selectedCategories } = useLensState();
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
              className="flex select-none min-w-[100px]"
              onClick={() => {
                ctx.column.toggleSorting();
                setActiveColumnId(ctx.column.id);
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
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSorting: true,
  });

  return (
    <div className="flex flex-col flex-1 max-w-[50vw] overflow-scroll bg-gray-900 rounded-2xl">
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
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
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
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
