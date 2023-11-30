import { random, sum } from "lodash";

export type LandscapeVisualization = {
  totalCount: number;
  segments: Array<Segment>;
  lenses: Array<CategoricalLens | ContinuousLens>;
};

export type Segment = {
  id: string;
  label: string;
  description: string;
  count: number;
};

export type CategoricalLens = {
  label: string;
  type: "categorical";
  description: string;
  segments: Array<{
    id: string;
    categories: Array<{
      label: string;
      count: number;
    }>;
  }>;
};

export type ContinuousLens = {
  label: string; // clickRate
  type: "continuous";
  description: string;
  segments: Array<{
    id: string;
    min: number;
    max: number;
    mean: number;
    median: number;
  }>;
};

export function generateMockData({
  numSegments = 10,
  numTotalCustomers = 200000,
}: {
  numSegments: number;
  numTotalCustomers: number;
}): LandscapeVisualization {
  const mockSegments: Segment[] = [];
  const mockCategoricalLenses: CategoricalLens[] = [];
  const mockContinuousLenses: ContinuousLens[] = [];

  let randomCounts = Array.from({ length: numSegments }, () =>
    random(1000, numTotalCustomers, false)
  );

  const sumOfCounts = sum(randomCounts);

  randomCounts = randomCounts.map((count) =>
    Math.floor((count / sumOfCounts) * numTotalCustomers)
  );

  for (let i = 0; i < numSegments; i++) {
    mockSegments.push({
      id: `segment-${i + 1}`,
      label: `Segment ${i + 1}`,
      description: `This is mock segment ${i + 1}`,
      count: randomCounts[i],
    });
  }

  for (let i = 0; i < 3; i++) {
    const numCategories = random(1, 5, false);

    mockCategoricalLenses.push({
      label: `Categorical ${i + 1}`,
      type: "categorical",
      description: `This is a mock categorical lens ${i + 1}`,
      segments: mockSegments.map((segment) => {
        const categoryCounts = Array.from({ length: numCategories }, () =>
          random(1, Math.floor(segment.count / numCategories), false)
        );
        const sumOfCategoryCounts = sum(categoryCounts);
        if (sumOfCategoryCounts < segment.count) {
          categoryCounts[0] += segment.count - sumOfCategoryCounts;
        }
        return {
          id: segment.id,
          categories: categoryCounts.map((count, j) => ({
            label: `Entity ${j + 1}`,
            count,
          })),
        };
      }),
    });

    mockContinuousLenses.push({
      label: `Continuous ${i + 1}`,
      type: "continuous",
      description: `This is a mock continuous lens ${i}`,
      segments: mockSegments.map((segment) => {
        const min = 0;
        const max = numTotalCustomers;
        const median = numTotalCustomers / 2;
        const mean = random(0, numTotalCustomers, false);

        return {
          id: segment.id,
          min,
          max,
          mean,
          median,
        };
      }),
    });
  }

  const mockData: LandscapeVisualization = {
    totalCount: numTotalCustomers,
    segments: mockSegments,
    lenses: [...mockContinuousLenses, ...mockCategoricalLenses],
  };

  return mockData;
}
