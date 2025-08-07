export const TEST_EAGLEVIEW_REPORT = {
  reportId: "TEST-62292599",
  address: "18004 Avalon Lane, Tampa, FL 33647",
  reportDate: "2024-10-21",
  source: "EagleView Premium Report",

  measurements: {
    totalArea: 3503, // sq ft
    totalSquares: 35.03,
    facetCount: 15,

    areasByPitch: [
      { pitch: "0/12", area: 175, percentage: 5 },
      { pitch: "6/12", area: 3328, percentage: 95 }
    ],

    totalRidges: 47,
    totalHips: 166,
    totalValleys: 40,
    totalRakes: 42,
    totalEaves: 304,
    totalDripEdge: 346,
    totalStepFlashing: 56,

    wasteFactors: {
      "0%": 3328,
      "1%": 3362,
      "6%": 3528,
      "11%": 3695,
      "14%": 3791,
      "16%": 3861,
      "18%": 3928,
      "21%": 4027,
      "26%": 4194
    }
  },

  structure: {
    type: "Residential",
    stories: 1,
    complexity: "Normal",
    predominantPitch: "6/12"
  }
} as const;
