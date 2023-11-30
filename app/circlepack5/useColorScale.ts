import { useMemo } from "react";
import { scaleQuantile } from "@visx/scale";
import { LandscapeVisualization } from "./mockData";
import usePreparedData from "./usePreparedData";

function extent<D>(allData: D[], value: (d: D) => number): [number, number] {
  return [Math.min(...allData.map(value)), Math.max(...allData.map(value))];
}

const colorRange2 = ["#3900DC", "#6D29FF", "#AB00FC", "#E40089", "#FF1D38"];

export default function useColorScale(values: number[]) {
  const colorScale = useMemo(() => {
    const domain: [number, number] = [Math.min(...values), Math.max(...values)];

    return scaleQuantile({
      domain,
      range: colorRange2,
    });
  }, [values]);

  return colorScale;
}
