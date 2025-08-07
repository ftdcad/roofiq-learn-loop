import { supabase } from '@/integrations/supabase/client';
import { ModelPrediction, GeometryAnalysisInput, UncertaintyAnalysis } from '@/types/dual-learning';
import { RoofFacet, RoofMeasurements, AreasByPitch, PropertyDetails } from '@/types/roof-analysis';

export class GeometryModel {
  private modelVersion = 'geometry-v2.1';
  private confidenceThreshold = 0.75;

  async predict(input: GeometryAnalysisInput): Promise<ModelPrediction> {
    const startTime = Date.now();
    
    try {
      console.log('GeometryModel: Starting footprint-based analysis for:', input.address);
      
      // Call the analyze-roof function with geometry-specific parameters
      const { data, error } = await supabase.functions.invoke('analyze-roof', {
        body: { 
          address: input.address,
          footprintData: input.footprintData,
          modelType: 'geometry',
          analysisMode: 'structural',
          buildingContext: {
            age: input.buildingAge,
            style: input.architecturalStyle,
            neighborhood: input.neighborhoodContext
          }
        }
      });

      if (error) {
        throw new Error(`Geometry model error: ${error.message}`);
      }

      // Extract prediction with geometry-specific processing
      const basePrediction = data.prediction;
      const uncertainty = this.calculateGeometricUncertainty(input, basePrediction);
      
      const prediction: ModelPrediction = {
        estimate: basePrediction.totalArea,
        facets: this.enhanceFacetsWithGeometryData(basePrediction.facets, input),
        measurements: this.enhanceMeasurements(basePrediction.measurements, input),
        confidence: this.calculateGeometryConfidence(basePrediction, input),
        uncertainty: uncertainty.variance,
        reasoning: this.generateGeometryReasoning(basePrediction, input, uncertainty),
        modelVersion: this.modelVersion,
        processingTime: Date.now() - startTime
      };

      console.log('GeometryModel: Analysis completed with confidence:', prediction.confidence);
      return prediction;

    } catch (error) {
      console.error('GeometryModel prediction error:', error);
      throw error;
    }
  }

  private calculateGeometricUncertainty(input: GeometryAnalysisInput, prediction: any): UncertaintyAnalysis {
    const riskFactors: string[] = [];
    let uncertaintyScore = 0;

    // Missing footprint data
    if (!input.footprintData) {
      riskFactors.push('No detailed footprint data available');
      uncertaintyScore += 0.2;
    }

    // Building age uncertainty
    if (!input.buildingAge) {
      riskFactors.push('Unknown building age affects structural assumptions');
      uncertaintyScore += 0.1;
    } else if (input.buildingAge < 1950) {
      riskFactors.push('Older building - non-standard construction practices');
      uncertaintyScore += 0.15;
    }

    // Architectural style uncertainty
    if (!input.architecturalStyle) {
      riskFactors.push('Unknown architectural style');
      uncertaintyScore += 0.1;
    }

    // Neighborhood context
    if (!input.neighborhoodContext) {
      riskFactors.push('No neighborhood context for validation');
      uncertaintyScore += 0.15;
    } else {
      const areaDeviation = Math.abs(prediction.totalArea - input.neighborhoodContext.averageRoofArea) / input.neighborhoodContext.averageRoofArea;
      if (areaDeviation > 0.5) {
        riskFactors.push('Significantly different from neighborhood average');
        uncertaintyScore += 0.2;
      }
    }

    // Structural complexity
    if (prediction.reportSummary?.roofComplexityScore > 0.8) {
      riskFactors.push('Highly complex roof structure');
      uncertaintyScore += 0.25;
    }

    // Calculate confidence range
    const baseArea = prediction.totalArea || 2000;
    const variancePercent = Math.min(uncertaintyScore * 0.3, 0.25); // Max 25% variance
    
    return {
      variance: uncertaintyScore,
      confidenceRange: {
        min: baseArea * (1 - variancePercent),
        max: baseArea * (1 + variancePercent)
      },
      riskFactors,
      needsVerification: uncertaintyScore > 0.35
    };
  }

  private enhanceFacetsWithGeometryData(facets: RoofFacet[], input: GeometryAnalysisInput): RoofFacet[] {
    if (!facets || !Array.isArray(facets)) {
      console.warn('GeometryModel: Invalid facets data, using empty array');
      return [];
    }
    return facets.map(facet => ({
      ...facet,
      confidence: this.adjustGeometricConfidence(facet, input),
      // Add geometry-specific metadata
      geometryMetadata: {
        structuralLikelihood: this.assessStructuralLikelihood(facet, input),
        neighborhoodTypical: this.compareToNeighborhood(facet, input),
        constructionFeasibility: this.assessConstructionFeasibility(facet, input)
      }
    }));
  }

  private enhanceMeasurements(measurements: RoofMeasurements, input: GeometryAnalysisInput): RoofMeasurements {
    // Apply architectural style adjustments
    if (input.architecturalStyle === 'Victorian') {
      return {
        ...measurements,
        ridges: measurements.ridges * 1.2, // Victorian homes typically have more ridges
        valleys: measurements.valleys * 1.3,
        hips: measurements.hips * 0.8
      };
    }

    if (input.architecturalStyle === 'Ranch') {
      return {
        ...measurements,
        ridges: measurements.ridges * 0.8, // Ranch homes simpler
        valleys: measurements.valleys * 0.7,
        eaves: measurements.eaves * 1.1
      };
    }

    return measurements;
  }

  private calculateGeometryConfidence(prediction: any, input: GeometryAnalysisInput): number {
    let confidence = 0.85; // Base confidence for geometry model

    // Adjust based on available data
    if (input.footprintData) {
      confidence *= 1.1;
    } else {
      confidence *= 0.8;
    }

    if (input.buildingAge) {
      confidence *= 1.05;
    }

    if (input.architecturalStyle) {
      confidence *= 1.05;
    }

    // Neighborhood validation boost
    if (input.neighborhoodContext) {
      const areaDeviation = Math.abs(prediction.totalArea - input.neighborhoodContext.averageRoofArea) / input.neighborhoodContext.averageRoofArea;
      if (areaDeviation < 0.2) {
        confidence *= 1.1; // Close to neighborhood average is good
      } else if (areaDeviation > 0.5) {
        confidence *= 0.8; // Far from average is concerning
      }
    }

    // Structural consistency
    if (prediction.reportSummary?.roofComplexityScore < 0.5) {
      confidence *= 1.05; // Simple structures are easier to predict
    }

    return Math.min(Math.max(confidence, 0.4), 1.0); // Clamp between 0.4 and 1.0
  }

  private generateGeometryReasoning(prediction: any, input: GeometryAnalysisInput, uncertainty: UncertaintyAnalysis): string[] {
    const reasoning: string[] = [];

    reasoning.push(`Analyzed structural footprint for ${input.address}`);
    
    if (input.architecturalStyle) {
      reasoning.push(`Applied ${input.architecturalStyle} architectural style adjustments`);
    }

    if (input.buildingAge) {
      const ageCategory = input.buildingAge < 1950 ? 'historic' : input.buildingAge < 1990 ? 'traditional' : 'modern';
      reasoning.push(`Building age suggests ${ageCategory} construction methods`);
    }

    if (input.neighborhoodContext) {
      const deviation = Math.abs(prediction.totalArea - input.neighborhoodContext.averageRoofArea) / input.neighborhoodContext.averageRoofArea;
      if (deviation < 0.2) {
        reasoning.push('Roof area consistent with neighborhood patterns');
      } else {
        reasoning.push(`Roof area ${deviation > 0.5 ? 'significantly' : 'moderately'} different from neighborhood average`);
      }
    }

    reasoning.push(`Detected ${prediction.facets?.length || 0} geometric sections`);
    
    if (uncertainty.riskFactors.length > 0) {
      reasoning.push(`Identified ${uncertainty.riskFactors.length} geometric uncertainty factors`);
    }

    reasoning.push(`Geometry model confidence: ${Math.round(this.calculateGeometryConfidence(prediction, input) * 100)}%`);

    return reasoning;
  }

  private assessStructuralLikelihood(facet: RoofFacet, input: GeometryAnalysisInput): number {
    // Mock implementation - assess if facet makes structural sense
    if (facet.type === 'main' && facet.area > 500) {
      return 0.9; // Large main facets are structurally sound
    }
    if (facet.type === 'dormer' && facet.area < 100) {
      return 0.8; // Small dormers are typical
    }
    return 0.7;
  }

  private compareToNeighborhood(facet: RoofFacet, input: GeometryAnalysisInput): number {
    if (!input.neighborhoodContext) return 0.5;
    
    // Mock comparison to neighborhood patterns
    const pitchMatch = input.neighborhoodContext.commonPitches.includes(facet.pitch);
    return pitchMatch ? 0.8 : 0.6;
  }

  private assessConstructionFeasibility(facet: RoofFacet, input: GeometryAnalysisInput): number {
    // Mock assessment of construction feasibility
    if (input.buildingAge && input.buildingAge < 1950) {
      // Older buildings less likely to have complex geometries
      return facet.type === 'main' ? 0.9 : 0.6;
    }
    return 0.8;
  }

  private adjustGeometricConfidence(facet: RoofFacet, input: GeometryAnalysisInput): number {
    let confidence = facet.confidence;

    // Boost confidence for structurally typical facets
    if (facet.type === 'main' && facet.area > 800) {
      confidence *= 1.1;
    }

    // Reduce confidence for unusual combinations
    if (facet.type === 'dormer' && facet.area > 300) {
      confidence *= 0.9; // Large dormers are less common
    }

    return Math.min(confidence, 1.0);
  }
}