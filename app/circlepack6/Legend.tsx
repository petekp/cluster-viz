import { LegendQuantile } from "@visx/legend";

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

export default function Legend({ colorScale }: { colorScale: any }) {
  return (
    <LegendQuantile
      scale={colorScale}
      className="rounded-md bg-black bg-opacity-50 p-3 text-xs backdrop-blur-md"
      labelTransform={transformlabel}
    />
  );
}
