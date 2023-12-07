import { useMemo } from "react";
import {
  CategoricalLens,
  ContinuousLens,
  LandscapeVisualization,
} from "./mockData";
import { hierarchy } from "@visx/hierarchy";
import { scaleQuantile } from "@visx/scale";
import { colorScaleRange } from "./config";

function createHierarchy(data: LandscapeVisualization) {
  return hierarchy({
    id: "root",
    label: "root",
    description: "",
    value: data.totalCount,
    count: data.totalCount,
    children: data.segments.map((segment) => ({
      id: segment.id,
      label: segment.label,
      value: segment.count,
      description: segment.description,
      count: segment.count,
    })),
  })
    .sum((d) => d.value)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
}

function getColorScaleValue(domain: [number, number], value: number) {
  const colorScale = scaleQuantile({
    domain,
    range: colorScaleRange,
  });

  return colorScale(value);
}

export function usePreparedVizData(data: LandscapeVisualization) {
  const lensValues = useMemo(() => {
    return data.lenses.reduce(
      (acc, lens) => {
        const allCounts = data.segments.map((segment) => segment.count);
        const minCount = Math.min(...allCounts);
        const maxCount = Math.max(...allCounts);

        console.log("minCount", minCount);
        console.log("maxCount", maxCount);

        acc.default = data.segments.reduce(
          (segmentAcc, segment) => {
            const color = getColorScaleValue(
              [minCount, maxCount],
              segment.count,
            );
            segmentAcc[segment.id] = {
              value: 1,
              color,
            };
            return segmentAcc;
          },
          {} as Record<string, { value: number; color: string }>,
        );

        if (lens.type === "continuous") {
          const segmentCounts = lens.segments.map((segment) => segment.mean);
          const minCount = Math.min(...segmentCounts);
          const maxCount = Math.max(...segmentCounts);

          acc[lens.label] = lens.segments.reduce(
            (segmentAcc, segment) => {
              const normalizedValue = segment.mean / segment.max;
              segmentAcc[segment.id] = {
                value: normalizedValue,
                color: getColorScaleValue([minCount, maxCount], segment.mean),
              };
              return segmentAcc;
            },
            {} as Record<string, { value: number; color: string }>,
          );
        }

        if (lens.type === "categorical") {
          lens.segments.forEach((segment) => {
            const segmentTotalCount = segment.categories.reduce(
              (categoryAcc, category) => categoryAcc + category.count,
              0,
            );

            segment.categories.forEach((category) => {
              const key = `${lens.label}-${category.label}`;
              if (!acc[key]) {
                acc[key] = {};
              }
              acc[key][segment.id] = category.count / segmentTotalCount;
            });
          });
        }

        return acc;
      },
      {} as Record<
        string,
        Record<string, { value: number; color: string } | number>
      >,
    );
  }, [data]);

  const root = useMemo(() => createHierarchy(data), [data]);

  return { root, lensValues };
}

export function usePreparedTableData(data: LandscapeVisualization) {
  const columnMinMax: Record<
    string,
    Record<string, { min: number; max: number }>
  > = {};

  const tableData = data.segments.map((segment) => {
    const row: any = {
      id: segment.id,
      label: segment.label,
      count: segment.count,
    };

    data.lenses.forEach((lens) => {
      const lensData = lens.segments.find((s) => s.id === segment.id);
      if (lensData) {
        if (lens.type === "continuous" && "mean" in lensData) {
          const continuousLens = lens as ContinuousLens;

          row[continuousLens.label] = lensData.mean;

          // Calculate min and max for the column
          if (!columnMinMax[lens.label]) {
            columnMinMax[lens.label] = {
              min: lensData.mean,
              max: lensData.mean,
            };
          } else {
            columnMinMax[lens.label].min = Math.min(
              columnMinMax[lens.label].min,
              lensData.mean,
            );
            columnMinMax[lens.label].max = Math.max(
              columnMinMax[lens.label].max,
              lensData.mean,
            );
          }
        }

        if (lens.type === "categorical" && "categories" in lensData) {
          const categoricalLens = lens as CategoricalLens;
          row[categoricalLens.label] = lensData.categories;

          // Calculate min and max for each category in the column
          lensData.categories.forEach((category) => {
            if (!columnMinMax[lens.label]) {
              columnMinMax[lens.label] = {};
            }
            if (!columnMinMax[lens.label][category.label]) {
              columnMinMax[lens.label][category.label] = {
                min: category.count,
                max: category.count,
              };
            } else {
              columnMinMax[lens.label][category.label].min = Math.min(
                columnMinMax[lens.label][category.label].min,
                category.count,
              );
              columnMinMax[lens.label][category.label].max = Math.max(
                columnMinMax[lens.label][category.label].max,
                category.count,
              );
            }
          });
        }
      }
    });

    return row;
  });

  return { tableData, columnMinMax };
}
