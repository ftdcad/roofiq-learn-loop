import { RoofPrediction, TrainingProgress } from '@/types/roof-analysis';

export const generateMockPrediction = (address: string): RoofPrediction => {
  const facetCount = Math.floor(Math.random() * 4) + 2; // 2-5 facets
  const baseArea = Math.floor(Math.random() * 1000) + 1500; // 1500-2500 sq ft
  
  return {
    id: crypto.randomUUID(),
    address,
    coordinates: { lat: 40.7128, lng: -74.0060 },
    predictionDate: new Date(),
    prediction: {
      facets: Array.from({ length: facetCount }, (_, i) => ({
        id: `facet-${i}`,
        polygon: [],
        area: baseArea / facetCount + Math.random() * 200,
        pitch: ['6/12', '8/12', '10/12', '12/12'][Math.floor(Math.random() * 4)],
        type: i === 0 ? 'main' : ['dormer', 'addition', 'garage'][Math.floor(Math.random() * 3)] as any,
        confidence: 75 + Math.random() * 20
      })),
      totalArea: baseArea,
      squares: baseArea / 100,
      measurements: {
        ridges: Math.floor(Math.random() * 50) + 30,
        valleys: Math.floor(Math.random() * 30) + 10,
        hips: Math.floor(Math.random() * 40) + 20,
        rakes: Math.floor(Math.random() * 60) + 40,
        eaves: Math.floor(Math.random() * 80) + 60
      },
      predominantPitch: ['6/12', '8/12', '10/12'][Math.floor(Math.random() * 3)],
      wasteFactor: 15 + Math.random() * 5,
      confidence: 70 + Math.random() * 25
    }
  };
};

export const generateMockComparison = (prediction: RoofPrediction) => {
  const areaError = (Math.random() - 0.5) * 20; // -10% to +10%
  const actualArea = prediction.prediction.totalArea * (1 - areaError / 100);
  
  const eagleViewData = {
    reportId: `EV-${Date.now()}`,
    uploadDate: new Date(),
    facets: prediction.prediction.facets.map(f => ({
      ...f,
      area: f.area * (0.9 + Math.random() * 0.2) // Slight variations
    })),
    totalArea: actualArea,
    squares: actualArea / 100,
    measurements: {
      ridges: prediction.prediction.measurements.ridges + Math.floor((Math.random() - 0.5) * 20),
      valleys: prediction.prediction.measurements.valleys + Math.floor((Math.random() - 0.5) * 10),
      hips: prediction.prediction.measurements.hips + Math.floor((Math.random() - 0.5) * 15),
      rakes: prediction.prediction.measurements.rakes + Math.floor((Math.random() - 0.5) * 25),
      eaves: prediction.prediction.measurements.eaves + Math.floor((Math.random() - 0.5) * 30)
    },
    pitch: prediction.prediction.predominantPitch,
    wasteFactor: prediction.prediction.wasteFactor + Math.floor((Math.random() - 0.5) * 4)
  };

  const comparison = {
    areaErrorPercent: areaError,
    facetAccuracy: 85 + Math.random() * 10,
    measurementAccuracy: 80 + Math.random() * 15,
    missedFeatures: [
      'Small dormer on north side',
      'Garage overhang detail',
      'Chimney penetration area'
    ].slice(0, Math.floor(Math.random() * 3) + 1),
    overallScore: 75 + Math.random() * 20
  };

  return { eagleViewData, comparison };
};

export const getMockTrainingProgress = (): TrainingProgress => ({
  totalComparisons: 847,
  targetComparisons: 3000,
  averageAccuracy: 83.2,
  facetDetectionRate: 89.5,
  areaAccuracy: 91.3,
  pitchAccuracy: 86.7,
  estimatedDaysToTarget: 127,
  modelVersion: '2.1.4'
});