"use client";

import { CircleProps, ResponsiveCirclePacking } from "@nivo/circle-packing";
import { ResponsivePieCanvas } from "@nivo/pie";
import { animated } from "react-spring";

interface RawDatum {
  name: string;
  loc: number;
}

const mockData = {
  name: "nivo",
  color: "#fff",
  children: [
    {
      name: "pathB1",
      color: "hsl(218, 70%, 50%)",
      loc: 53761,
    },
    {
      name: "pathB2",
      color: "hsl(247, 70%, 50%)",
      loc: 101804,
    },
    {
      name: "pathB3",
      color: "hsl(356, 70%, 50%)",
      loc: 82573,
    },
    {
      name: "pathB4",
      color: "hsl(227, 70%, 50%)",
      loc: 35791,
    },
  ],
};

const MyPie = () => (
  <ResponsivePieCanvas
    data={[
      {
        id: "css",
        label: "css",
        value: 358,
        color: "hsl(68, 70%, 50%)",
      },
      {
        id: "haskell",
        label: "haskell",
        value: 12,
        color: "hsl(339, 70%, 50%)",
      },
      {
        id: "php",
        label: "php",
        value: 295,
        color: "hsl(79, 70%, 50%)",
      },
      {
        id: "stylus",
        label: "stylus",
        value: 146,
        color: "hsl(301, 70%, 50%)",
      },
      {
        id: "go",
        label: "go",
        value: 425,
        color: "hsl(310, 70%, 50%)",
      },
    ]}
    margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
    innerRadius={0.5}
    padAngle={0.7}
    cornerRadius={3}
    activeOuterRadiusOffset={8}
    borderWidth={1}
    borderColor={{
      from: "color",
      modifiers: [["darker", 0.2]],
    }}
    arcLinkLabelsSkipAngle={10}
    arcLinkLabelsTextColor="#333333"
    arcLinkLabelsThickness={2}
    arcLinkLabelsColor={{ from: "color" }}
    arcLabelsSkipAngle={10}
    arcLabelsTextColor={{
      from: "color",
      modifiers: [["darker", 2]],
    }}
    defs={[
      {
        id: "dots",
        type: "patternDots",
        background: "inherit",
        color: "rgba(255, 255, 255, 0.3)",
        size: 4,
        padding: 1,
        stagger: true,
      },
      {
        id: "lines",
        type: "patternLines",
        background: "inherit",
        color: "rgba(255, 255, 255, 0.3)",
        rotation: -45,
        lineWidth: 6,
        spacing: 10,
      },
    ]}
    fill={[
      {
        match: {
          id: "ruby",
        },
        id: "dots",
      },
      {
        match: {
          id: "c",
        },
        id: "dots",
      },
      {
        match: {
          id: "go",
        },
        id: "dots",
      },
      {
        match: {
          id: "python",
        },
        id: "dots",
      },
      {
        match: {
          id: "scala",
        },
        id: "lines",
      },
      {
        match: {
          id: "lisp",
        },
        id: "lines",
      },
      {
        match: {
          id: "elixir",
        },
        id: "lines",
      },
      {
        match: {
          id: "javascript",
        },
        id: "lines",
      },
    ]}
    legends={[
      {
        anchor: "bottom",
        direction: "row",
        justify: false,
        translateX: 0,
        translateY: 56,
        itemsSpacing: 0,
        itemWidth: 100,
        itemHeight: 18,
        itemTextColor: "#999",
        itemDirection: "left-to-right",
        itemOpacity: 1,
        symbolSize: 18,
        symbolShape: "circle",
        effects: [
          {
            on: "hover",
            style: {
              itemTextColor: "#000",
            },
          },
        ],
      },
    ]}
  />
);

const MyResponsiveCirclePacking = ({ data }: { data: any }) => (
  <ResponsiveCirclePacking
    data={data}
    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
    id="name"
    value="loc"
    colors={{ scheme: "nivo" }}
    childColor={{
      from: "color",
      modifiers: [["brighter", 0.4]],
    }}
    padding={4}
    enableLabels={true}
    labelsFilter={(n) => 2 === n.node.depth}
    labelsSkipRadius={10}
    labelTextColor={{
      from: "color",
      modifiers: [["darker", 2]],
    }}
    borderWidth={1}
    borderColor={{
      from: "color",
      modifiers: [["darker", 0.5]],
    }}
    defs={[
      {
        id: "lines",

        background: "none",
        color: "inherit",
        rotation: -45,
        lineWidth: 5,
        spacing: 8,
      },
    ]}
    fill={[
      {
        match: {
          depth: 1,
        },
        id: "lines",
      },
    ]}
    circleComponent={({
      node,
      style,
      onMouseEnter,
      onMouseMove,
      onMouseLeave,
      onClick,
    }: CircleProps<RawDatum>) => {
      return (
        <animated.circle
          key={node.id}
          cx={style.x}
          cy={style.y}
          r={style.radius}
          fill={style.color}
          stroke={style.borderColor}
          strokeWidth={style.borderWidth}
          opacity={style.opacity}
          height={200}
          width={200}
          onMouseEnter={(event) => onMouseEnter?.(node, event)}
          onMouseMove={(event) => onMouseMove?.(node, event)}
          onMouseLeave={(event) => onMouseLeave?.(node, event)}
          onClick={(event) => onClick?.(node, event)}
        >
          <MyPie />
        </animated.circle>
      );
    }}
  />
);

export default function Home() {
  return (
    <main className="absolute w-full h-full left-0 top-0 bg-white">
      <MyResponsiveCirclePacking data={mockData} />
    </main>
  );
}
