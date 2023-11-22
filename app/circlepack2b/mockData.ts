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
    random(1000, numTotalCustomers)
  );

  const sumOfCounts = sum(randomCounts);

  randomCounts = randomCounts.map((count) =>
    Math.floor((count / sumOfCounts) * numTotalCustomers)
  );

  for (let i = 0; i < numSegments; i++) {
    mockSegments.push({
      id: `${i}`,
      label: `Mock Segment ${i}`,
      description: `This is mock segment ${i}`,
      count: randomCounts[i],
    });
  }

  for (let i = 0; i < 3; i++) {
    const categoryCount = random(2, 10);
    mockCategoricalLenses.push({
      label: `Mock Categorical Lens ${i}`,
      type: "categorical",
      description: `This is a mock categorical lens ${i}`,
      segments: mockSegments.map((segment) => ({
        id: segment.id,
        categories: Array.from({ length: categoryCount }, (_, j) => ({
          label: `Category ${j}`,
          count: random(1000, segment.count),
        })),
      })),
    });

    mockContinuousLenses.push({
      label: `Mock Continuous Lens ${i}`,
      type: "continuous",
      description: `This is a mock continuous lens ${i}`,
      segments: mockSegments.map((segment) => ({
        min: 0,
        max: 100,
        mean: Math.random() * 100,
        median: Math.random() * 100,
        id: segment.id,
      })),
    });
  }

  const mockData: LandscapeVisualization = {
    totalCount: numTotalCustomers,
    segments: mockSegments,
    lenses: [...mockCategoricalLenses, ...mockContinuousLenses],
  };

  return mockData;
}
