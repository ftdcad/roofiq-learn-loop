import { VisionModel } from './VisionModel';
import { GeometryModel } from './GeometryModel';
import { 
  ConsensusResult, 
  ModelPrediction, 
  ImageAnalysisInput, 
  GeometryAnalysisInput,
  UncertaintyAnalysis,
  LearningMetrics 
} from '@/types/dual-learning';
import { RoofFacet, AreasByPitch, PropertyDetails } from '@/types/roof-analysis';

export class DualLearningEngine {
  private visionModel: VisionModel;
  private geometryModel: GeometryModel;
  private disagreementThreshold = 100; // Square feet
  private learningMetrics: LearningMetrics;

  constructor() {
    this.visionModel = new VisionModel();
    this.geometryModel = new GeometryModel();
    this.learningMetrics = {
      totalPredictions: 0,
      accurateConsensus: 0,
      conflictResolutions: 0,
      visionModelWins: 0,
      geometryModelWins: 0,
      averageProcessingTime: 0,
      uncertaintyCalibration: 0
    };
  }

  async predict(address: string, satelliteImage?: string): Promise<ConsensusResult> {
    const startTime = Date.now();
    this.learningMetrics.totalPredictions++;

    try {
      console.log('DualLearningEngine: Starting dual-model prediction for:', address);

      // Prepare inputs for both models
      const imageInput: ImageAnalysisInput = {
        address,
        satelliteImage,
        coordinates: { lat: 40.7128, lng: -74.0060 }, // Would be geocoded in production
        imageQuality: this.assessImageQuality(satelliteImage),
        seasonality: this.detectSeasonality(),
        timeOfDay: this.detectTimeOfDay()
      };

      const geometryInput: GeometryAnalysisInput = {
        address,
        buildingAge: await this.estimateBuildingAge(address),
        architecturalStyle: await this.detectArchitecturalStyle(address),
        neighborhoodContext: await this.getNeighborhoodContext(address)
      };

      // Run both models in parallel for maximum efficiency
      const [visionPrediction, geometryPrediction] = await Promise.all([
        this.visionModel.predict(imageInput),
        this.geometryModel.predict(geometryInput)
      ]);

      console.log('DualLearningEngine: Vision prediction facets:', visionPrediction.facets);
      console.log('DualLearningEngine: Geometry prediction facets:', geometryPrediction.facets);
      console.log('DualLearningEngine: Vision facets type:', typeof visionPrediction.facets, Array.isArray(visionPrediction.facets));
      console.log('DualLearningEngine: Geometry facets type:', typeof geometryPrediction.facets, Array.isArray(geometryPrediction.facets));

      // Create consensus between the models
      const consensus = await this.createConsensus(
        visionPrediction, 
        geometryPrediction, 
        imageInput, 
        geometryInput
      );

      // Update performance metrics
      this.updateMetrics(startTime, visionPrediction, geometryPrediction, consensus);

      console.log('DualLearningEngine: Consensus achieved with confidence:', consensus.confidence);
      return consensus;

    } catch (error) {
      console.error('DualLearningEngine prediction error:', error);
      throw error;
    }
  }

  private async createConsensus(
    visionPrediction: ModelPrediction,
    geometryPrediction: ModelPrediction,
    imageInput: ImageAnalysisInput,
    geometryInput: GeometryAnalysisInput
  ): Promise<ConsensusResult> {
    
    const areaDifference = Math.abs(visionPrediction.estimate - geometryPrediction.estimate);
    const averageEstimate = (visionPrediction.estimate + geometryPrediction.estimate) / 2;
    const agreementLevel = 1 - (areaDifference / averageEstimate);
    
    // Determine which model to trust more based on conditions
    const visionWeight = this.calculateVisionWeight(visionPrediction, imageInput);
    const geometryWeight = this.calculateGeometryWeight(geometryPrediction, geometryInput);
    const totalWeight = visionWeight + geometryWeight;
    
    // Weighted consensus
    const consensusEstimate = (
      (visionPrediction.estimate * visionWeight) + 
      (geometryPrediction.estimate * geometryWeight)
    ) / totalWeight;

    // Merge facets intelligently
    const consensusFacets = this.mergeFacets(visionPrediction.facets, geometryPrediction.facets);
    
    // Create combined uncertainty analysis
    const combinedUncertainty = this.combineUncertaintyAnalysis(
      visionPrediction, 
      geometryPrediction, 
      areaDifference
    );

    // Determine confidence level
    let confidence: 'high' | 'medium' | 'low';
    if (agreementLevel > 0.9 && visionPrediction.confidence > 0.8 && geometryPrediction.confidence > 0.8) {
      confidence = 'high';
    } else if (agreementLevel > 0.8 || (visionPrediction.confidence > 0.7 && geometryPrediction.confidence > 0.7)) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    // Generate reasoning
    const reasoning = this.generateConsensusReasoning(
      visionPrediction, 
      geometryPrediction, 
      areaDifference, 
      agreementLevel
    );

    // Determine if this needs EagleView learning
    const learningFlag = this.assessLearningNeed(
      areaDifference, 
      confidence, 
      visionPrediction, 
      geometryPrediction
    );

    return {
      estimate: consensusEstimate,
      confidence,
      modelAgreement: agreementLevel,
      finalPrediction: {
        facets: consensusFacets,
        totalArea: consensusEstimate,
        squares: Math.round(consensusEstimate / 100),
        measurements: this.mergeMeasurements(visionPrediction.measurements, geometryPrediction.measurements),
        predominantPitch: this.determinePredominantPitch(consensusFacets),
        wasteFactor: (visionPrediction.estimate * 0.1 + geometryPrediction.estimate * 0.1) / 2, // Mock calculation
        confidence: (visionPrediction.confidence + geometryPrediction.confidence) / 2,
        areasByPitch: this.calculateAreasByPitch(consensusFacets),
        propertyDetails: this.mergePropertyDetails(visionPrediction, geometryPrediction),
        reportSummary: {
          totalPerimeter: consensusFacets.reduce((sum, facet) => sum + (facet.polygon.length * 10), 0), // Mock calculation
          averagePitch: this.calculateAveragePitch(consensusFacets),
          roofComplexityScore: Math.min(consensusFacets.length / 10, 1) // Complexity based on facet count
        },
        uncertaintyAnalysis: combinedUncertainty,
        dualModelInsights: {
          visionModelStrength: visionWeight / totalWeight,
          geometryModelStrength: geometryWeight / totalWeight,
          conflictAreas: this.identifyConflictAreas(visionPrediction, geometryPrediction),
          learningOpportunities: this.identifyLearningOpportunities(visionPrediction, geometryPrediction, areaDifference)
        }
      },
      reasoning,
      learningFlag
    };
  }

  private calculateVisionWeight(prediction: ModelPrediction, input: ImageAnalysisInput): number {
    let weight = 0.5; // Base weight

    // Boost vision weight with good image quality
    if (input.imageQuality && input.imageQuality > 0.8) {
      weight += 0.2;
    }

    // Boost for good lighting conditions
    if (input.timeOfDay === 'afternoon') {
      weight += 0.1;
    }

    // Model confidence factor
    weight *= prediction.confidence;

    return Math.max(weight, 0.1);
  }

  private calculateGeometryWeight(prediction: ModelPrediction, input: GeometryAnalysisInput): number {
    let weight = 0.5; // Base weight

    // Boost with good structural data
    if (input.footprintData) {
      weight += 0.15;
    }

    if (input.buildingAge) {
      weight += 0.1;
    }

    if (input.neighborhoodContext) {
      weight += 0.15;
    }

    // Model confidence factor
    weight *= prediction.confidence;

    return Math.max(weight, 0.1);
  }

  private combineUncertaintyAnalysis(
    visionPrediction: ModelPrediction,
    geometryPrediction: ModelPrediction,
    areaDifference: number
  ): UncertaintyAnalysis {
    const combinedVariance = (visionPrediction.uncertainty + geometryPrediction.uncertainty) / 2;
    const disagreementVariance = areaDifference / Math.max(visionPrediction.estimate, geometryPrediction.estimate);
    
    const totalVariance = Math.max(combinedVariance, disagreementVariance);
    
    const averageEstimate = (visionPrediction.estimate + geometryPrediction.estimate) / 2;
    const variancePercent = Math.min(totalVariance * 0.3, 0.4);

    return {
      variance: totalVariance,
      confidenceRange: {
        min: averageEstimate * (1 - variancePercent),
        max: averageEstimate * (1 + variancePercent)
      },
      riskFactors: [
        ...this.extractRiskFactors(visionPrediction.reasoning),
        ...this.extractRiskFactors(geometryPrediction.reasoning),
        ...(areaDifference > this.disagreementThreshold ? ['Model disagreement detected'] : [])
      ],
      needsVerification: totalVariance > 0.4 || areaDifference > this.disagreementThreshold * 2
    };
  }

  private mergeFacets(visionFacets: RoofFacet[], geometryFacets: RoofFacet[]): RoofFacet[] {
    console.log('DualLearningEngine: mergeFacets called with:', { visionFacets, geometryFacets });
    console.log('DualLearningEngine: visionFacets type:', typeof visionFacets, 'isArray:', Array.isArray(visionFacets));
    console.log('DualLearningEngine: geometryFacets type:', typeof geometryFacets, 'isArray:', Array.isArray(geometryFacets));
    
    // Handle undefined or null facets arrays
    const safeVisionFacets = Array.isArray(visionFacets) ? visionFacets : [];
    const safeGeometryFacets = Array.isArray(geometryFacets) ? geometryFacets : [];
    
    console.log('DualLearningEngine: Safe arrays created:', { safeVisionFacets, safeGeometryFacets });
    
    if (safeVisionFacets.length === 0 && safeGeometryFacets.length === 0) {
      console.warn('DualLearningEngine: Both facets arrays are empty, creating default facet');
      return [{
        id: 'default-main',
        polygon: [[0, 0], [100, 0], [100, 100], [0, 100]],
        area: 2000,
        pitch: '8/12',
        type: 'main',
        confidence: 0.5
      }];
    }
    
    // Intelligent facet merging - simplified for now
    const allFacets = [...safeVisionFacets, ...safeGeometryFacets];
    const mergedFacets: RoofFacet[] = [];
    
    console.log('DualLearningEngine: All facets combined:', allFacets);
    
    // Group by type and merge similar facets
    const facetsByType = allFacets.reduce((acc, facet) => {
      if (!facet || !facet.type) {
        console.warn('DualLearningEngine: Invalid facet found:', facet);
        return acc;
      }
      if (!acc[facet.type]) acc[facet.type] = [];
      acc[facet.type].push(facet);
      return acc;
    }, {} as Record<string, RoofFacet[]>);

    Object.entries(facetsByType).forEach(([type, facets]) => {
      if (facets.length === 1) {
        mergedFacets.push(facets[0]);
      } else {
        // Merge similar facets
        const avgArea = facets.reduce((sum, f) => sum + f.area, 0) / facets.length;
        const avgConfidence = facets.reduce((sum, f) => sum + f.confidence, 0) / facets.length;
        
        mergedFacets.push({
          id: `merged-${type}-${Date.now()}`,
          polygon: facets[0].polygon, // Use first polygon as base
          area: avgArea,
          pitch: facets[0].pitch, // Use most common pitch
          type: type as any,
          confidence: avgConfidence
        });
      }
    });

    return mergedFacets;
  }

  private mergeMeasurements(vision: any, geometry: any): any {
    // Average the measurements from both models
    return {
      ridges: Math.round((vision.ridges + geometry.ridges) / 2),
      valleys: Math.round((vision.valleys + geometry.valleys) / 2),
      hips: Math.round((vision.hips + geometry.hips) / 2),
      rakes: Math.round((vision.rakes + geometry.rakes) / 2),
      eaves: Math.round((vision.eaves + geometry.eaves) / 2),
      gutters: Math.round((vision.gutters + geometry.gutters) / 2),
      stepFlashing: Math.round((vision.stepFlashing + geometry.stepFlashing) / 2),
      drip: Math.round((vision.drip + geometry.drip) / 2)
    };
  }

  private generateConsensusReasoning(
    visionPrediction: ModelPrediction,
    geometryPrediction: ModelPrediction,
    areaDifference: number,
    agreementLevel: number
  ): string {
    const parts = [
      `Vision model estimated ${Math.round(visionPrediction.estimate)} sq ft`,
      `Geometry model estimated ${Math.round(geometryPrediction.estimate)} sq ft`,
      `Models ${agreementLevel > 0.9 ? 'strongly agree' : agreementLevel > 0.8 ? 'generally agree' : 'show some disagreement'}`,
      `Area difference: ${Math.round(areaDifference)} sq ft`
    ];

    if (areaDifference > this.disagreementThreshold) {
      parts.push('⚠️ Significant model disagreement suggests learning opportunity');
    }

    return parts.join(' • ');
  }

  private assessLearningNeed(
    areaDifference: number,
    confidence: 'high' | 'medium' | 'low',
    visionPrediction: ModelPrediction,
    geometryPrediction: ModelPrediction
  ) {
    if (areaDifference > this.disagreementThreshold * 2) {
      return {
        priority: 'high' as const,
        reason: 'Major model disagreement',
        suggestedAction: 'Upload EagleView report for model learning'
      };
    }

    if (confidence === 'low') {
      return {
        priority: 'medium' as const,
        reason: 'Low confidence prediction',
        suggestedAction: 'Consider EagleView verification'
      };
    }

    if (visionPrediction.uncertainty > 0.5 || geometryPrediction.uncertainty > 0.5) {
      return {
        priority: 'medium' as const,
        reason: 'High model uncertainty',
        suggestedAction: 'EagleView upload would improve future predictions'
      };
    }

    return undefined;
  }

  // Helper methods for consensus creation
  private extractRiskFactors(reasoning: string[]): string[] {
    return reasoning.filter(r => r.includes('risk') || r.includes('uncertainty') || r.includes('shadow') || r.includes('complex'));
  }

  private determinePredominantPitch(facets: RoofFacet[]): string {
    const pitchCounts = facets.reduce((acc, facet) => {
      acc[facet.pitch] = (acc[facet.pitch] || 0) + facet.area;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(pitchCounts).reduce((a, b) => pitchCounts[a[0]] > pitchCounts[b[0]] ? a : b)[0];
  }

  private calculateAreasByPitch(facets: RoofFacet[]): AreasByPitch[] {
    const pitchAreas = facets.reduce((acc, facet) => {
      if (!acc[facet.pitch]) {
        acc[facet.pitch] = { area: 0, facets: 0 };
      }
      acc[facet.pitch].area += facet.area;
      acc[facet.pitch].facets += 1;
      return acc;
    }, {} as Record<string, { area: number; facets: number }>);

    const totalArea = Object.values(pitchAreas).reduce((sum, p) => sum + p.area, 0);

    return Object.entries(pitchAreas).map(([pitch, data]) => ({
      pitch,
      area: data.area,
      squares: Math.round(data.area / 100),
      percentage: Math.round((data.area / totalArea) * 100)
    }));
  }

  private calculateAveragePitch(facets: RoofFacet[]): string {
    // Simplified average pitch calculation
    const pitches = facets.map(f => parseFloat(f.pitch.replace(':', '/')) || 0);
    const avgPitch = pitches.reduce((sum, p) => sum + p, 0) / pitches.length;
    return `${Math.round(avgPitch)}:12`;
  }

  private mergePropertyDetails(visionPrediction: ModelPrediction, geometryPrediction: ModelPrediction): PropertyDetails {
    // Mock property details merging
    return {
      stories: 2,
      estimatedAtticArea: Math.round((visionPrediction.estimate + geometryPrediction.estimate) * 0.3),
      structureComplexity: 'Moderate' as const,
      roofAccessibility: 'Moderate' as const,
      chimneys: 1,
      skylights: 2,
      vents: 4
    };
  }

  private identifyConflictAreas(visionPrediction: ModelPrediction, geometryPrediction: ModelPrediction): string[] {
    const conflicts: string[] = [];
    
    const visionFacetCount = (visionPrediction.facets || []).length;
    const geometryFacetCount = (geometryPrediction.facets || []).length;
    
    if (Math.abs(visionFacetCount - geometryFacetCount) > 2) {
      conflicts.push('Facet count disagreement');
    }

    if (Math.abs(visionPrediction.estimate - geometryPrediction.estimate) > this.disagreementThreshold) {
      conflicts.push('Total area disagreement');
    }

    return conflicts;
  }

  private identifyLearningOpportunities(
    visionPrediction: ModelPrediction,
    geometryPrediction: ModelPrediction,
    areaDifference: number
  ): string[] {
    const opportunities: string[] = [];

    if (areaDifference > this.disagreementThreshold) {
      opportunities.push('Model calibration from EagleView comparison');
    }

    if (visionPrediction.uncertainty > 0.4) {
      opportunities.push('Vision model improvement with verified satellite data');
    }

    if (geometryPrediction.uncertainty > 0.4) {
      opportunities.push('Geometry model refinement with structural validation');
    }

    return opportunities;
  }

  private updateMetrics(
    startTime: number,
    visionPrediction: ModelPrediction,
    geometryPrediction: ModelPrediction,
    consensus: ConsensusResult
  ): void {
    const processingTime = Date.now() - startTime;
    this.learningMetrics.averageProcessingTime = 
      (this.learningMetrics.averageProcessingTime + processingTime) / 2;

    // Update agreement metrics
    if (consensus.modelAgreement > 0.9) {
      this.learningMetrics.accurateConsensus++;
    }

    if (consensus.modelAgreement < 0.8) {
      this.learningMetrics.conflictResolutions++;
    }
  }

  // Mock helper methods - would be implemented with real services
  private assessImageQuality(satelliteImage?: string): number {
    return satelliteImage ? 0.85 : 0.6; // Mock assessment
  }

  private detectSeasonality(): 'spring' | 'summer' | 'fall' | 'winter' {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private detectTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  private async estimateBuildingAge(address: string): Promise<number | undefined> {
    // Mock implementation - would use property records
    return 1985;
  }

  private async detectArchitecturalStyle(address: string): Promise<string | undefined> {
    // Mock implementation - would use property data/ML
    return 'Colonial';
  }

  private async getNeighborhoodContext(address: string) {
    // Mock implementation - would query neighborhood data
    return {
      averageRoofArea: 2200,
      commonPitches: ['6:12', '8:12'],
      typicalComplexity: 0.6
    };
  }

  public getMetrics(): LearningMetrics {
    return { ...this.learningMetrics };
  }
}