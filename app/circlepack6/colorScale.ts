import { scaleQuantile } from "@visx/scale";

export const colorScaleRange = [
  "#3900DC",
  "#6D29FF",
  "#AB00FC",
  "#E40089",
  "#FF1D38",
];

export function getColorScaleValue(domain: [number, number], value: number) {
  const colorScale = scaleQuantile({
    domain,
    range: colorScaleRange,
  });

  return colorScale(value);
}

export function getColorScale(domain: [number, number]) {
  return scaleQuantile({
    domain,
    range: colorScaleRange,
  });
}
