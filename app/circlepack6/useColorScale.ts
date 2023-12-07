import { useMemo } from "react";
import { scaleQuantile } from "@visx/scale";
import { colorScaleRange } from "./config";

function extent<D>(allData: D[], value: (d: D) => number): [number, number] {
  return [Math.min(...allData.map(value)), Math.max(...allData.map(value))];
}

export default function useColorScale(values: number[]) {
  const colorScale = useMemo(() => {
    const domain: [number, number] = [Math.min(...values), Math.max(...values)];

    return scaleQuantile({
      domain,
      range: colorScaleRange,
    });
  }, [values]);

  return colorScale;
}
