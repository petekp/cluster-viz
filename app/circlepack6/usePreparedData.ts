import { hierarchy } from "@visx/hierarchy";
import { useMemo } from "react";

import { getColorScale, getColorScaleValue } from "./colorScale";
import {
  CategoricalLens,
  ContinuousLens,
  LandscapeVisualization,
} from "./mockData";

function getMinMax(values: number[]) {
  return [Math.min(...values), Math.max(...values)];
}

function createHierarchy(data: LandscapeVisualization) {
  return (
    hierarchy({
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
      // Construct hierarchy based on the value property
      .sum((datum) => datum.value)
      // Larger circles should gravitate towards the center
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
  );
}

/**
 * Precomputes the landscape data into a shape that suits the needs
 * of the circle packing visualization.
 *
 * Returns two properties, "hierarchy" and "lensValues":
 *
 * "hierarchy": used to pack the circles; fed to the <Pack> component.
 *
 * "lensValues": Contains a normalized 0-1 value for each lens that's
 * used to size the inner circle and a color value based on the relative
 * value of the lens.
 *
 */
export function usePreparedVizData(data: LandscapeVisualization) {
  const lensValues = useMemo(() => {
    return data.lenses.reduce(
      (acc, lens) => {
        const allCounts = data.segments.map(({ count }) => count);
        const [min, max] = getMinMax(allCounts);

        // Default to a value of 1 for all segments if no lens is selected
        acc.default = data.segments.reduce(
          (segmentAcc, segment) => {
            const color = getColorScaleValue([min, max], segment.count);

            segmentAcc[segment.id] = {
              value: 1,
              color,
            };
            return segmentAcc;
          },
          {} as Record<string, { value: number; color: string }>,
        );

        if (lens.type === "continuous") {
          const values = lens.segments.map(({ mean }) => mean);
          const [min, max] = getMinMax(values);

          acc[lens.label] = lens.segments.reduce(
            (segmentAcc, { id, mean, max }) => {
              const normalizedValue = mean / max;
              const color = getColorScaleValue([min, max], mean);

              segmentAcc[id] = {
                value: normalizedValue,
                color,
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

  const colorScales = useMemo(() => {
    const scales: Record<string, (value: number) => string> = {};

    // Default color scale

    return data.lenses.reduce(
      (acc, lens) => {
        const allCounts = data.segments.map(({ count }) => count);
        const [min, max] = getMinMax(allCounts);
        acc.default = getColorScale([min, max]);

        if (lens.type === "continuous") {
          const segmentMeans = lens.segments.map(({ mean }) => mean);
          const [min, max] = getMinMax(segmentMeans);

          acc[lens.label] = getColorScale([min, max]);
        } else if (lens.type === "categorical") {
          lens.segments.forEach((segment) => {
            segment.categories.forEach((category) => {
              const key = `${lens.label}-${category.label}`;
              const [min, max] = getMinMax(
                segment.categories.map(({ count }) => count),
              );

              acc[key] = getColorScale([min, max]);
            });
          });
        }

        return acc;
      },
      {} as Record<string, (value: number) => string>,
    );
  }, [data]);

  const hierarchy = useMemo(() => createHierarchy(data), [data]);

  return { hierarchy, lensValues, colorScales };
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
