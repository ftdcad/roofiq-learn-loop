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
  gutters: number;
  stepFlashing: number;
  drip: number;
}

export interface AreasByPitch {
  pitch: string;
  area: number;
  squares: number;
  percentage: number;
}

export interface PropertyDetails {
  stories: number;
  estimatedAtticArea: number;
  structureComplexity: 'Simple' | 'Moderate' | 'Complex' | 'Very Complex';
  roofAccessibility: 'Easy' | 'Moderate' | 'Difficult';
  chimneys: number;
  skylights: number;
  vents: number;
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
    areasByPitch: AreasByPitch[];
    propertyDetails: PropertyDetails;
    reportSummary: {
      totalPerimeter: number;
      averagePitch: string;
      roofComplexityScore: number;
    };
    // Enhanced dual-model metadata
    dualModelMetadata?: {
      modelAgreement: number;
      confidence: 'high' | 'medium' | 'low';
      reasoning: string;
      learningFlag?: {
        priority: 'high' | 'medium' | 'low';
        reason: string;
        suggestedAction: string;
      };
      visionModelStrength: number;
      geometryModelStrength: number;
      uncertaintyAnalysis: {
        variance: number;
        confidenceRange: {
          min: number;
          max: number;
        };
        riskFactors: string[];
        needsVerification: boolean;
      };
    };
  };
  
  validationData?: {
    reportId: string;
    uploadDate: Date;
    facets: RoofFacet[];
    totalArea: number;
    squares: number;
    measurements: RoofMeasurements;
    pitch: string;
    wasteFactor: number;
    areasByPitch: AreasByPitch[];
    propertyDetails: PropertyDetails;
    reportSummary: {
      totalPerimeter: number;
      averagePitch: string;
      roofComplexityScore: number;
    };
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

export interface ValidationReport {
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