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
  label: string;
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
    random(1000, numTotalCustomers, false),
  );

  const sumOfCounts = sum(randomCounts);

  randomCounts = randomCounts.map((count) =>
    Math.floor((count / sumOfCounts) * numTotalCustomers),
  );

  // Ensure the sum of randomCounts equals numTotalCustomers
  const discrepancy = numTotalCustomers - sum(randomCounts);
  randomCounts[randomCounts.length - 1] += discrepancy;

  for (let i = 0; i < numSegments; i++) {
    mockSegments.push({
      id: `segment-${i + 1}`,
      label: `Segment ${i + 1}`,
      description: `This is a mock segment ${i + 1}`,
      count: randomCounts[i],
    });
  }

  for (let i = 0; i < 3; i++) {
    const numCategories = random(2, 5, false); // Ensure at least two categories

    mockCategoricalLenses.push({
      label: `Categorical ${i + 1}`,
      type: "categorical",
      description: `This is a mock categorical lens ${i + 1}`,
      segments: mockSegments.map((segment) => {
        const categories = Array.from({ length: numCategories }, () => ({
          label: `Entity ${random(1, numCategories)}`,
          count: random(1, segment.count, false),
        }));

        return {
          id: segment.id,
          categories,
        };
      }),
    });

    mockContinuousLenses.push({
      label: `Continuous ${i + 1}`,
      type: "continuous",
      description: `This is a mock continuous lens ${i + 1}`,
      segments: mockSegments.map((segment) => ({
        id: segment.id,
        min: 0,
        max: segment.count,
        mean: random(0, segment.count, false),
        median: random(0, segment.count, false), // Assuming median is also random for mock data
      })),
    });
  }

  const mockData: LandscapeVisualization = {
    totalCount: numTotalCustomers,
    segments: mockSegments,
    lenses: [...mockContinuousLenses, ...mockCategoricalLenses],
  };

  return mockData;
}
