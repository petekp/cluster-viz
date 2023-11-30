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
