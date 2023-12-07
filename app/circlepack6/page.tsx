"use client";

// This prototype demonstrates a circle pack visualization with a continuous and categorical lenses. The categorical lenses support showing a SINGLE entity across all segments.

// The visualization is controlled through the table on the left. The table supports sorting and filtering. The table also supports selecting a lens and a category. The visualization will update to reflect the selected lens and category.

import React from "react";
import ParentSize from "@visx/responsive/lib/components/ParentSize";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { debounce } from "lodash";

import { LandscapeVisualization, generateMockData } from "./mockData";
import { LensProvider } from "./LensContext";
import LandscapeViz from "./LandscapeViz";
import SegmentsTable from "./SegmentsTable";

export default function Home() {
  const [data, setData] = React.useState<LandscapeVisualization | null>(null);
  const [numSegments, setNumSegments] = React.useState(12);

  const debouncedSetNumSegments = React.useCallback(
    debounce(setNumSegments, 250),
    [],
  );

  React.useEffect(() => {
    const mockData = generateMockData({
      numSegments: numSegments,
      numTotalCustomers: 1000000,
    });

    setData(mockData);
  }, [numSegments]);

  if (!data) {
    return null;
  }

  return (
    <LensProvider>
      <main className="flex h-full w-full gap-4 p-5">
        <PanelGroup direction="horizontal">
          <Panel minSizePercentage={25}>
            <div className="flex flex-col justify-center">
              <SegmentsTable data={data} />
              <div className="mt-4 flex max-w-xl flex-col">
                <label htmlFor="numSegments">
                  Mock segments: {numSegments}
                </label>
                <input
                  type="range"
                  id="numSegments"
                  name="numSegments"
                  min="1"
                  max="100"
                  value={numSegments}
                  onChange={(e) =>
                    debouncedSetNumSegments(Number(e.target.value))
                  }
                />
              </div>
            </div>
          </Panel>
          <PanelResizeHandle className="w-2 rounded-full bg-gray-900 transition-all hover:bg-gray-700" />
          <Panel minSizePercentage={25}>
            <ParentSize>
              {({ width, height }) => (
                <LandscapeViz data={data} width={width} height={height} />
              )}
            </ParentSize>
          </Panel>
        </PanelGroup>
      </main>
    </LensProvider>
  );
}
