import { useMemo } from "react";
import {
  CategoricalLens,
  ContinuousLens,
  LandscapeVisualization,
} from "./mockData";
import { hierarchy } from "@visx/hierarchy";
import { Datum } from "./page";

export default function usePreparedData({
  data,
  activeLens,
  activeCategory,
}: {
  data: LandscapeVisualization;
  activeLens: string | null;
  activeCategory: string | null;
}) {
  const activeLensData = useMemo(() => {
    return data.lenses.find((lens) => lens.label === activeLens);
  }, [data, activeLens, activeCategory]);

  const preparedData = useMemo(() => {
    return prepareLensData({ data, activeLensData, activeCategory });
  }, [data, activeLensData, activeCategory]);

  const root = useMemo(() => {
    return hierarchy<Datum>(preparedData)
      .sum((d) => d.count)
      .sort((a, b) => {
        return b.data.count - a.data.count;
      });
  }, [preparedData, activeCategory, activeLens]);

  return { preparedData, root } as const;
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
          segment.categories.find((c) => c.label === activeCategory)?.count ||
          0,
      ),
    );

    return {
      id: "root",
      label: "root",
      description: "",
      count: 0,
      value: 0,
      children: data.segments.map((segment) => {
        const matchingSegment = activeLensData.segments.find(
          (s) => s.id === segment.id,
        );
        const matchingCategory = matchingSegment?.categories.find(
          (c) => c.label === activeCategory,
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
          (s) => s.id === segment.id,
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

function createHierarchy(data: LandscapeVisualization) {
  return hierarchy({
    id: "root",
    children: data.segments.map((segment) => ({
      id: segment.id,
      label: segment.label,
      value: segment.count,
    })),
    value: data.totalCount,
  }).sum((d) => d.value);
}

export function usePreparedDataNewest(
  data: LandscapeVisualization,
  activeLens: string | null,
  activeCategory: string | null,
) {
  const lensValues = useMemo(() => {
    const activeLensData = data.lenses.find(
      (lens) => lens.label === activeLens,
    );

    if (
      activeLensData &&
      activeLensData.type === "categorical" &&
      activeCategory
    ) {
      return activeLensData.segments.reduce(
        (acc, segment) => {
          const matchingCategory = segment.categories.find(
            (c) => c.label === activeCategory,
          );

          const segmentTotalCount = segment.categories.reduce(
            (acc, category) => acc + category.count,
            0,
          );

          console.log({ segment });

          acc[segment.id] = matchingCategory
            ? matchingCategory.count / segmentTotalCount
            : 0;
          return acc;
        },
        {} as Record<string, number>,
      );
    }

    if (activeLensData && activeLensData.type === "continuous") {
      return activeLensData.segments.reduce(
        (acc, segment) => {
          acc[segment.id] = segment.mean / segment.max;
          return acc;
        },
        {} as Record<string, number>,
      );
    }

    // Default case when there is no active lens or category
    return data.segments.reduce(
      (acc, segment) => {
        acc[segment.id] = 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [data, activeLens, activeCategory]);

  const root = useMemo(() => createHierarchy(data), [data]);

  return { root, lensValues };
}

export function prepareTableDataForSegments(data: LandscapeVisualization) {
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
        if (lens.type === "continuous") {
          row[lens.label] = lensData.mean;

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
        } else if (lens.type === "categorical") {
          row[lens.label] = lensData.categories;

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
