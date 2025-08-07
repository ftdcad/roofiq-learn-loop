import { supabase } from '@/integrations/supabase/client';
import { ModelPrediction, ImageAnalysisInput, UncertaintyAnalysis } from '@/types/dual-learning';
import { RoofFacet, RoofMeasurements, AreasByPitch, PropertyDetails } from '@/types/roof-analysis';

export class VisionModel {
  private modelVersion = 'vision-v2.1';
  private confidenceThreshold = 0.7;

  async predict(input: ImageAnalysisInput): Promise<ModelPrediction> {
    const startTime = Date.now();
    
    try {
      console.log('VisionModel: Starting satellite image analysis for:', input.address);
      
      // Call the analyze-roof function with vision-specific parameters
      const { data, error } = await supabase.functions.invoke('analyze-roof', {
        body: { 
          address: input.address,
          satelliteImage: input.satelliteImage,
          modelType: 'vision',
          analysisMode: 'detailed',
          includeUncertainty: true
        }
      });

      if (error) {
        throw new Error(`Vision model error: ${error.message}`);
      }

      // Extract prediction with vision-specific processing
      const basePrediction = data.prediction;
      const uncertainty = this.calculateUncertainty(input, basePrediction);
      
      const prediction: ModelPrediction = {
        estimate: basePrediction.totalArea,
        facets: this.enhanceFacetsWithVisionData(basePrediction.facets, input),
        measurements: basePrediction.measurements,
        confidence: this.calculateVisionConfidence(basePrediction, input),
        uncertainty: uncertainty.variance,
        reasoning: this.generateVisionReasoning(basePrediction, input, uncertainty),
        modelVersion: this.modelVersion,
        processingTime: Date.now() - startTime
      };

      console.log('VisionModel: Analysis completed with confidence:', prediction.confidence);
      return prediction;

    } catch (error) {
      console.error('VisionModel prediction error:', error);
      throw error;
    }
  }

  private calculateUncertainty(input: ImageAnalysisInput, prediction: any): UncertaintyAnalysis {
    const riskFactors: string[] = [];
    let uncertaintyScore = 0;

    // Image quality factors
    if (input.imageQuality && input.imageQuality < 0.7) {
      riskFactors.push('Poor satellite image quality');
      uncertaintyScore += 0.3;
    }

    // Seasonal/lighting factors
    if (input.seasonality === 'winter') {
      riskFactors.push('Winter imagery may have snow/shadow issues');
      uncertaintyScore += 0.1;
    }

    if (input.timeOfDay === 'morning' || input.timeOfDay === 'evening') {
      riskFactors.push('Long shadows may affect measurement accuracy');
      uncertaintyScore += 0.15;
    }

    // Structural complexity
    if (prediction.facets && prediction.facets.length > 8) {
      riskFactors.push('Complex roof structure with many facets');
      uncertaintyScore += 0.2;
    }

    // Calculate confidence range based on uncertainty
    const baseArea = prediction.totalArea || 2000;
    const variancePercent = Math.min(uncertaintyScore * 0.4, 0.3); // Max 30% variance
    
    return {
      variance: uncertaintyScore,
      confidenceRange: {
        min: baseArea * (1 - variancePercent),
        max: baseArea * (1 + variancePercent)
      },
      riskFactors,
      needsVerification: uncertaintyScore > 0.4
    };
  }

  private enhanceFacetsWithVisionData(facets: RoofFacet[], input: ImageAnalysisInput): RoofFacet[] {
    return facets.map(facet => ({
      ...facet,
      confidence: this.adjustFacetConfidence(facet, input),
      // Add vision-specific metadata
      visionMetadata: {
        shadowImpact: this.assessShadowImpact(facet, input),
        edgeClarity: this.assessEdgeClarity(facet),
        occlusionLevel: this.assessOcclusion(facet)
      }
    }));
  }

  private calculateVisionConfidence(prediction: any, input: ImageAnalysisInput): number {
    let confidence = 0.8; // Base confidence for vision model

    // Adjust based on image quality
    if (input.imageQuality) {
      confidence *= input.imageQuality;
    }

    // Adjust based on structural complexity
    if (prediction.facets && prediction.facets.length > 6) {
      confidence *= 0.9; // Slightly less confident with complex structures
    }

    // Adjust based on measurement consistency
    if (prediction.reportSummary?.roofComplexityScore > 0.8) {
      confidence *= 0.85;
    }

    return Math.max(confidence, 0.3); // Minimum confidence threshold
  }

  private generateVisionReasoning(prediction: any, input: ImageAnalysisInput, uncertainty: UncertaintyAnalysis): string[] {
    const reasoning: string[] = [];

    reasoning.push(`Analyzed satellite imagery for ${input.address}`);
    reasoning.push(`Detected ${prediction.facets?.length || 0} roof facets`);
    
    if (input.imageQuality && input.imageQuality > 0.8) {
      reasoning.push('High-quality satellite imagery provides clear roof boundaries');
    }

    if (uncertainty.riskFactors.length > 0) {
      reasoning.push(`Identified ${uncertainty.riskFactors.length} uncertainty factors`);
    }

    if (prediction.reportSummary?.roofComplexityScore > 0.7) {
      reasoning.push('Complex roof structure detected - recommend EagleView verification');
    }

    reasoning.push(`Vision model confidence: ${Math.round(this.calculateVisionConfidence(prediction, input) * 100)}%`);

    return reasoning;
  }

  private assessShadowImpact(facet: RoofFacet, input: ImageAnalysisInput): number {
    // Mock implementation - in production, this would analyze actual shadows
    if (input.timeOfDay === 'morning' || input.timeOfDay === 'evening') {
      return 0.7; // Higher shadow impact
    }
    return 0.2; // Lower shadow impact
  }

  private assessEdgeClarity(facet: RoofFacet): number {
    // Mock implementation - would analyze edge detection quality
    return 0.8; // Good edge clarity
  }

  private assessOcclusion(facet: RoofFacet): number {
    // Mock implementation - would detect tree/structure occlusion
    return 0.1; // Low occlusion
  }

  private adjustFacetConfidence(facet: RoofFacet, input: ImageAnalysisInput): number {
    let confidence = facet.confidence;

    // Adjust based on facet type - main roof easier to detect
    if (facet.type === 'main') {
      confidence *= 1.1;
    } else if (facet.type === 'dormer') {
      confidence *= 0.9; // Dormers harder to detect from satellite
    }

    return Math.min(confidence, 1.0);
  }
}