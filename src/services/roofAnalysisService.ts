import { supabase } from '@/integrations/supabase/client';
import { RoofPrediction, TrainingProgress } from '@/types/roof-analysis';
import { DualLearningEngine } from './models/DualLearningEngine';

export class RoofAnalysisService {
  private static dualEngine = new DualLearningEngine();

  static async analyzeRoof(address: string, satelliteImage?: string): Promise<RoofPrediction> {
    try {
      console.log('Starting enhanced dual-model roof analysis for:', address);
      
      // Use the new dual-model architecture
      const consensus = await this.dualEngine.predict(address, satelliteImage);
      
      console.log('RoofAnalysisService: Consensus received:', {
        hasFinalPrediction: !!consensus.finalPrediction,
        facetsType: typeof consensus.finalPrediction?.facets,
        facetsIsArray: Array.isArray(consensus.finalPrediction?.facets),
        facetsLength: consensus.finalPrediction?.facets?.length,
        totalArea: consensus.finalPrediction?.totalArea,
        confidence: consensus.confidence
      });
      
      // Convert consensus result to RoofPrediction format
      const prediction: RoofPrediction = {
        id: crypto.randomUUID(),
        address,
        coordinates: { lat: 40.7128, lng: -74.0060 }, // Would be geocoded in production
        satelliteImage,
        predictionDate: new Date(),
        prediction: {
          facets: consensus.finalPrediction.facets || [],
          totalArea: consensus.finalPrediction.totalArea || 0,
          squares: consensus.finalPrediction.squares || 0,
          measurements: consensus.finalPrediction.measurements || {
            ridges: 0,
            valleys: 0,
            hips: 0,
            rakes: 0,
            eaves: 0,
            gutters: 0,
            stepFlashing: 0,
            drip: 0
          },
          predominantPitch: consensus.finalPrediction.predominantPitch || '4/12',
          wasteFactor: consensus.finalPrediction.wasteFactor || 15,
          confidence: consensus.finalPrediction.confidence || 0,
          areasByPitch: consensus.finalPrediction.areasByPitch || [],
          propertyDetails: consensus.finalPrediction.propertyDetails || {
            stories: 1,
            estimatedAtticArea: 0,
            structureComplexity: 'Moderate' as const,
            roofAccessibility: 'Moderate',
            chimneys: 0,
            skylights: 0,
            vents: 0
          },
          reportSummary: consensus.finalPrediction.reportSummary || {
            totalPerimeter: 0,
            averagePitch: '4/12',
            roofComplexityScore: 0
          },
          // Add dual-model specific metadata
          dualModelMetadata: {
            modelAgreement: consensus.modelAgreement,
            confidence: consensus.confidence,
            reasoning: consensus.reasoning,
            learningFlag: consensus.learningFlag,
            visionModelStrength: consensus.finalPrediction.dualModelInsights.visionModelStrength,
            geometryModelStrength: consensus.finalPrediction.dualModelInsights.geometryModelStrength,
            uncertaintyAnalysis: consensus.finalPrediction.uncertaintyAnalysis
          }
        }
      };

      console.log('RoofAnalysisService: Final prediction created:', {
        id: prediction.id,
        hasPrediction: !!prediction.prediction,
        facetsCount: prediction.prediction?.facets?.length || 0,
        totalArea: prediction.prediction?.totalArea,
        hasPropertyDetails: !!prediction.prediction?.propertyDetails,
        hasReportSummary: !!prediction.prediction?.reportSummary
      });

      console.log('Enhanced dual-model analysis completed with confidence:', consensus.confidence);
      console.log('Model agreement level:', Math.round(consensus.modelAgreement * 100) + '%');
      
      // Log learning opportunities
      if (consensus.learningFlag) {
        console.log('🎯 Learning opportunity detected:', consensus.learningFlag.reason);
      }

      return prediction;

    } catch (error) {
      console.error('Error in dual-model roof analysis:', error);
      throw error;
    }
  }

  static async processEagleViewUpload(
    analysisId: string, 
    file: File
  ): Promise<{ eagleViewData: any; comparison: any }> {
    try {
      console.log('Processing EagleView upload for analysis:', analysisId);

      // For now, we'll just pass the file info. 
      // In a production system, you'd upload the file to Supabase Storage first
      const { data, error } = await supabase.functions.invoke('process-eagleview', {
        body: { 
          analysisId,
          eagleviewFile: {
            name: file.name,
            size: file.size,
            type: file.type
          },
          // In production, you'd extract text from PDF here or upload to storage
          fileContent: `Mock EagleView Report for ${file.name}` 
        }
      });

      if (error) {
        console.error('EagleView processing error:', error);
        throw new Error(`Processing failed: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Processing failed');
      }

      console.log('EagleView processing completed successfully');
      return {
        eagleViewData: data.eagleviewData,
        comparison: data.comparison
      };

    } catch (error) {
      console.error('Error processing EagleView upload:', error);
      throw error;
    }
  }

  static async getTrainingProgress(): Promise<TrainingProgress> {
    try {
      const { data, error } = await supabase
        .from('training_progress')
        .select('*')
        .order('last_updated', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching training progress:', error);
        throw error;
      }

      if (!data) {
        // Return default if no data found
        return {
          totalComparisons: 0,
          targetComparisons: 3000,
          averageAccuracy: 0,
          facetDetectionRate: 0,
          areaAccuracy: 0,
          pitchAccuracy: 0,
          estimatedDaysToTarget: 365,
          modelVersion: '3.0.0'
        };
      }

      return {
        totalComparisons: data.total_comparisons,
        targetComparisons: data.target_comparisons,
        averageAccuracy: data.average_accuracy,
        facetDetectionRate: data.facet_detection_rate,
        areaAccuracy: data.area_accuracy,
        pitchAccuracy: data.pitch_accuracy,
        estimatedDaysToTarget: data.estimated_days_to_target,
        modelVersion: data.model_version
      };

    } catch (error) {
      console.error('Error fetching training progress:', error);
      // Return default values on error
      return {
        totalComparisons: 0,
        targetComparisons: 3000,
        averageAccuracy: 0,
        facetDetectionRate: 0,
        areaAccuracy: 0,
        pitchAccuracy: 0,
        estimatedDaysToTarget: 365,
        modelVersion: '3.0.0'
      };
    }
  }

  static async updateAnalysisWithEagleView(
    predictionId: string,
    eagleViewData: any,
    comparison: any
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('roof_analyses')
        .update({
          eagleview_data: eagleViewData,
          eagleview_upload_date: new Date().toISOString(),
          eagleview_report_id: eagleViewData.reportId,
          comparison_results: comparison,
          area_error_percent: Math.abs(comparison.areaErrorPercent),
          overall_accuracy_score: comparison.overallScore
        })
        .eq('id', predictionId);

      if (error) {
        console.error('Error updating analysis:', error);
        throw error;
      }

      console.log('Analysis updated with EagleView data');
    } catch (error) {
      console.error('Error updating analysis with EagleView data:', error);
      throw error;
    }
  }
}