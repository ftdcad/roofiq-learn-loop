// Enhanced types for dual-model architecture
import { RoofFacet, RoofMeasurements, AreasByPitch, PropertyDetails } from './roof-analysis';

export interface ModelPrediction {
  estimate: number;
  facets: RoofFacet[];
  measurements: RoofMeasurements;
  confidence: number;
  uncertainty: number;
  reasoning: string[];
  modelVersion: string;
  processingTime: number;
}

export interface UncertaintyAnalysis {
  variance: number;
  confidenceRange: {
    min: number;
    max: number;
  };
  riskFactors: string[];
  needsVerification: boolean;
}

export interface ConsensusResult {
  estimate: number;
  confidence: 'high' | 'medium' | 'low';
  modelAgreement: number; // 0-1 scale
  finalPrediction: {
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
    uncertaintyAnalysis: UncertaintyAnalysis;
    dualModelInsights: {
      visionModelStrength: number;
      geometryModelStrength: number;
      conflictAreas: string[];
      learningOpportunities: string[];
    };
  };
  reasoning: string;
  learningFlag?: {
    priority: 'high' | 'medium' | 'low';
    reason: string;
    suggestedAction: string;
  };
}

export interface ImageAnalysisInput {
  address: string;
  satelliteImage?: string;
  coordinates: { lat: number; lng: number };
  imageQuality?: number;
  seasonality?: 'spring' | 'summer' | 'fall' | 'winter';
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
}

export interface GeometryAnalysisInput {
  address: string;
  footprintData?: string;
  buildingAge?: number;
  architecturalStyle?: string;
  neighborhoodContext?: {
    averageRoofArea: number;
    commonPitches: string[];
    typicalComplexity: number;
  };
}

export interface LearningMetrics {
  totalPredictions: number;
  accurateConsensus: number; // Both models agreed and were right
  conflictResolutions: number; // Models disagreed, learned from EagleView
  visionModelWins: number; // Vision was right, geometry was wrong
  geometryModelWins: number; // Geometry was right, vision was wrong
  averageProcessingTime: number;
  uncertaintyCalibration: number; // How well uncertainty predicts errors
}