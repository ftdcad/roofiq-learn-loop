export interface RoofFacet {
  id: string;
  polygon: [number, number][];
  area: number;
  pitch: string;
  type: 'main' | 'dormer' | 'addition' | 'garage';
  confidence: number;
}

export interface RoofMeasurements {
  ridges: number;
  valleys: number;
  hips: number;
  rakes: number;
  eaves: number;
}

export interface RoofPrediction {
  id: string;
  address: string;
  coordinates: { lat: number; lng: number };
  satelliteImage?: string;
  predictionDate: Date;
  
  prediction: {
    facets: RoofFacet[];
    totalArea: number;
    squares: number;
    measurements: RoofMeasurements;
    predominantPitch: string;
    wasteFactor: number;
    confidence: number;
  };
  
  eagleViewData?: {
    reportId: string;
    uploadDate: Date;
    facets: RoofFacet[];
    totalArea: number;
    squares: number;
    measurements: RoofMeasurements;
    pitch: string;
    wasteFactor: number;
  };
  
  comparison?: {
    areaErrorPercent: number;
    facetAccuracy: number;
    measurementAccuracy: number;
    missedFeatures: string[];
    overallScore: number;
  };
}

export interface TrainingProgress {
  totalComparisons: number;
  targetComparisons: number;
  averageAccuracy: number;
  facetDetectionRate: number;
  areaAccuracy: number;
  pitchAccuracy: number;
  estimatedDaysToTarget: number;
  modelVersion: string;
}

export interface EagleViewReport {
  reportId: string;
  address: string;
  uploadDate: Date;
  facets: RoofFacet[];
  totalArea: number;
  squares: number;
  measurements: RoofMeasurements;
  pitch: string;
  wasteFactor: number;
}