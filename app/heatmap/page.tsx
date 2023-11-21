"use client";

import { ComputedCell, ResponsiveHeatMap } from "@nivo/heatmap";
import { useState } from "react";
import { animated } from "react-spring";

const mockData = [
  {
    id: "Loyal Middle-Income Bachelor",
    data: [
      {
        x: "Count",
        y: 24,
      },
      {
        x: "LTV",
        y: 18,
      },
      {
        x: "Fashion",
        y: 6,
      },
      {
        x: "Books",
        y: 5,
      },
      {
        x: "Movies",
        y: 14,
      },
      {
        x: "Travel",
        y: 18,
      },
      {
        x: "Cooking",
        y: 8,
      },
      {
        x: "Arts",
        y: 7,
      },
    ],
  },
  {
    id: "Brand Loyalists with Diverse Interests",
    data: [
      {
        x: "Count",
        y: 14,
      },
      {
        x: "LTV",
        y: 11,
      },
      {
        x: "Fashion",
        y: 21,
      },
      {
        x: "Books",
        y: 9,
      },
      {
        x: "Movies",
        y: 16,
      },
      {
        x: "Travel",
        y: 12,
      },
      {
        x: "Cooking",
        y: 10,
      },
      {
        x: "Arts",
        y: 7,
      },
    ],
  },
  {
    id: "Predicted High LTV Affluent Techies",
    data: [
      {
        x: "Count",
        y: 39,
      },
      {
        x: "LTV",
        y: 7,
      },
      {
        x: "Fashion",
        y: 19,
      },
      {
        x: "Books",
        y: 8,
      },
      {
        x: "Movies",
        y: 11,
      },
      {
        x: "Travel",
        y: 9,
      },
      {
        x: "Cooking",
        y: 4,
      },
      {
        x: "Arts",
        y: 2,
      },
    ],
  },
  {
    id: "High-Value E-mail Users",
    data: [
      {
        x: "Count",
        y: 26,
      },
      {
        x: "LTV",
        y: 10,
      },
      {
        x: "Fashion",
        y: 20,
      },
      {
        x: "Books",
        y: 9,
      },
      {
        x: "Movies",
        y: 13,
      },
      {
        x: "Travel",
        y: 9,
      },
      {
        x: "Cooking",
        y: 9,
      },
      {
        x: "Arts",
        y: 4,
      },
    ],
  },
  {
    id: "Second Purchase Savvy",
    data: [
      {
        x: "Count",
        y: 15,
      },
      {
        x: "LTV",
        y: 10,
      },
      {
        x: "Fashion",
        y: 22,
      },
      {
        x: "Books",
        y: 6,
      },
      {
        x: "Movies",
        y: 13,
      },
      {
        x: "Travel",
        y: 17,
      },
      {
        x: "Cooking",
        y: 8,
      },
      {
        x: "Arts",
        y: 9,
      },
    ],
  },
  {
    id: "High-Value Repeat Customer",
    data: [
      {
        x: "Count",
        y: 11,
      },
      {
        x: "LTV",
        y: 16,
      },
      {
        x: "Fashion",
        y: 13,
      },
      {
        x: "Books",
        y: 8,
      },
      {
        x: "Movies",
        y: 14,
      },
      {
        x: "Travel",
        y: 12,
      },
      {
        x: "Cooking",
        y: 14,
      },
      {
        x: "Arts",
        y: 11,
      },
    ],
  },
  {
    id: "High-Value Sports Enthusiasts",
    data: [
      {
        x: "Count",
        y: 13,
      },
      {
        x: "LTV",
        y: 45,
      },
      {
        x: "Fashion",
        y: 4,
      },
      {
        x: "Books",
        y: 7,
      },
      {
        x: "Movies",
        y: 12,
      },
      {
        x: "Travel",
        y: 8,
      },
      {
        x: "Cooking",
        y: 8,
      },
      {
        x: "Arts",
        y: 1,
      },
    ],
  },
  {
    id: "Mid-Tier Female Shoppers",
    data: [
      {
        x: "Count",
        y: 8,
      },
      {
        x: "LTV",
        y: 1,
      },
      {
        x: "Fashion",
        y: 32,
      },
      {
        x: "Books",
        y: 9,
      },
      {
        x: "Movies",
        y: 16,
      },
      {
        x: "Travel",
        y: 12,
      },
      {
        x: "Cooking",
        y: 13,
      },
      {
        x: "Arts",
        y: 9,
      },
    ],
  },
];

const MyResponsiveHeatMap = ({ data }: { data: typeof mockData }) => {
  const [chartData, setChartData] = useState<typeof mockData>(data);
  const [sortedLabel, setSortedLabel] = useState("");

  function onClickYLabel(
    label: string,
    event: React.MouseEvent<SVGTextElement, MouseEvent>
  ) {
    // Find the clicked row
    const clickedRow = chartData.find((item) => item.id === label);

    if (!clickedRow) return;

    // Sort the x values based on the y values of the clicked row
    const sortedXValues = [...clickedRow.data]
      .sort((a, b) => b.y - a.y)
      .map((item) => item.x);

    // Sort the data of all rows based on the sorted x values
    const sortedData = chartData.map((item) => ({
      ...item,
      data: sortedXValues.map(
        (x) => item.data.find((d) => d.x === x) || { x, y: 0 }
      ),
    }));

    setChartData(sortedData);
  }

  function onClickXLabel(
    label: string,
    event: React.MouseEvent<SVGTextElement, MouseEvent>
  ) {
    // Sort the rows based on the y values of the clicked column
    const sortedData = [...chartData].sort((a, b) => {
      const aValue = a.data.find((item) => item.x === label)?.y || 0;
      const bValue = b.data.find((item) => item.x === label)?.y || 0;
      return bValue - aValue;
    });

    setChartData(sortedData);
  }

  return (
    <ResponsiveHeatMap
      data={chartData}
      margin={{ top: 60, right: 90, bottom: 60, left: 240 }}
      valueFormat=">-.2s"
      axisTop={{
        tickRotation: -90,
        legend: "favoriteproductcategory",
        legendPosition: "middle",
        legendOffset: -45,
        renderTick: (tick) => {
          return (
            <animated.text
              {...tick.animatedProps}
              fontSize={12}
              fontWeight={tick.value === sortedLabel ? 700 : 400}
              y={tick.textY}
              x={tick.textX - 30}
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                setSortedLabel(tick.value);
                onClickXLabel(tick.value, e);
              }}
            >
              {tick.value}
            </animated.text>
          );
        },
      }}
      borderWidth={1}
      borderColor="rgba(255,255,255,0.2)"
      inactiveOpacity={0.5}
      axisLeft={{
        legend: "Segment",
        legendPosition: "middle",
        tickSize: 5,
        tickPadding: 10,
        tickRotation: 0,
        legendOffset: -220,
        renderTick: (tick) => {
          return (
            <animated.text
              {...tick.animatedProps}
              fontSize={12}
              x={tick.textX}
              fontWeight={sortedLabel === tick.value ? 700 : 400}
              alignmentBaseline="middle"
              textAnchor="end"
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                setSortedLabel(tick.value);
                onClickYLabel(tick.value, e);
              }}
            >
              {tick.value}
            </animated.text>
          );
        },
      }}
      colors={{
        type: "sequential",
        scheme: "plasma",

        minValue: 0,
        maxValue: 60,
      }}
      emptyColor="#FFF"
      labelTextColor="#FFF"
      motionConfig={{
        damping: 9,
        mass: 0.5,
      }}
      tooltip={() => undefined}
    />
  );
};

export default function Home() {
  return (
    <main className="absolute w-full h-full left-0 top-0 bg-white">
      <MyResponsiveHeatMap data={mockData} />
    </main>
  );
}
