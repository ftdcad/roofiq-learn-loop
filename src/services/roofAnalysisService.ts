import { supabase } from '@/integrations/supabase/client';
import { RoofPrediction, TrainingProgress } from '@/types/roof-analysis';
import { DualLearningEngine } from './models/DualLearningEngine';

export class RoofAnalysisService {
  private static dualEngine = new DualLearningEngine();
  private static cache = new Map<string, RoofPrediction>();

  static async analyzeRoof(address: string, satelliteImage?: string): Promise<RoofPrediction> {
    try {
      console.log('Starting enhanced dual-model roof analysis for:', address);

      // 1) Validate and resolve address via geocoding for higher confidence
      let resolvedAddress = address;
      let coords: { lat: number; lng: number } = { lat: 40.7128, lng: -74.0060 };
      try {
        const { data, error } = await supabase.functions.invoke('geocode-address', {
          body: { address, autocomplete: false, limit: 1 }
        });
        if (!error && data?.features?.length) {
          const first = data.features[0];
          // Mapbox returns [lng, lat]
          if (Array.isArray(first.center) && first.center.length === 2) {
            coords = { lat: first.center[1], lng: first.center[0] };
          }
          if (first.place_name) {
            resolvedAddress = first.place_name;
          }
        } else if (error) {
          console.warn('Geocode validation failed, proceeding with raw address:', error);
        }
      } catch (geoErr) {
        console.warn('Geocode invocation error, proceeding with defaults:', geoErr);
      }
      
      // Address-based caching to ensure consistent results
      const cached = this.cache.get(resolvedAddress);
      if (cached) {
        console.log('Returning cached analysis for:', resolvedAddress);
        return cached;
      }
      
      // 2) Use the new dual-model architecture
      const consensus = await this.dualEngine.predict(resolvedAddress, satelliteImage);
      
      console.log('RoofAnalysisService: Consensus received:', {
        hasFinalPrediction: !!consensus.finalPrediction,
        facetsType: typeof consensus.finalPrediction?.facets,
        facetsIsArray: Array.isArray(consensus.finalPrediction?.facets),
        facetsLength: consensus.finalPrediction?.facets?.length,
        totalArea: consensus.finalPrediction?.totalArea,
        confidence: consensus.confidence
      });
      
      // Convert consensus result to RoofPrediction format
      // Sanitize/round values for professional display and safety
      const rawTotalArea = Number(consensus.finalPrediction.totalArea || 0);
      const roundedTotalArea = Math.round(rawTotalArea);
      const computedSquares = Number(((roundedTotalArea / 100) || 0).toFixed(1));
      const wfRaw = Number(consensus.finalPrediction.wasteFactor ?? 15);
      const wfClamped = Math.min(25, Math.max(10, Math.round(wfRaw)));
      if (wfRaw > 30) {
        console.error('IMPOSSIBLE WASTE FACTOR:', wfRaw);
      }

      let prediction: RoofPrediction = {
        id: '',
        address: resolvedAddress,
        coordinates: coords, // from geocoding
        satelliteImage,
        predictionDate: new Date(),
        prediction: {
          facets: consensus.finalPrediction.facets || [],
          totalArea: roundedTotalArea,
          squares: computedSquares,
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
          wasteFactor: wfClamped,
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

      // Persist an analysis row and use its real database id
      const { data: inserted, error: insertError } = await supabase
        .from('roof_analyses')
        .insert({
          address: resolvedAddress,
          coordinates: coords as any,
          ai_prediction: prediction.prediction as any,
          ai_confidence: prediction.prediction.confidence,
          satellite_image_url: satelliteImage || null,
          model_agreement: consensus.modelAgreement,
          consensus_confidence: consensus.confidence as any,
          source: 'dual-model'
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Failed to persist analysis before returning:', insertError);
        throw insertError;
      }

      prediction.id = inserted.id;
      this.cache.set(resolvedAddress, prediction);

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

  static async processValidationReportUpload(
    analysisId: string, 
    file: File
  ): Promise<{ validationData: any; comparison: any }> {
    try {
      console.log('Processing validation report upload for analysis:', analysisId);

      // For now, we'll just pass the file info. 
      // In a production system, you'd upload the file to Supabase Storage first
      const { data, error } = await supabase.functions.invoke('process-validation-report', {
        body: { 
          analysisId,
          validationFile: {
            name: file.name,
            size: file.size,
            type: file.type
          },
          // In production, you'd extract text from PDF here or upload to storage
          fileContent: `Mock Validation Report for ${file.name}`
        }
      });

      if (error) {
        console.error('Validation report processing error:', error);
        throw new Error(`Processing failed: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Processing failed');
      }

      console.log('Validation report processing completed successfully');
      return {
        validationData: data.validationData,
        comparison: data.comparison
      };

    } catch (error) {
      console.error('Error processing validation report upload:', error);
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

  static async updateAnalysisWithValidation(
    predictionId: string, 
    validationData: any, 
    comparison: any
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('roof_analyses')
        .update({
          validation_data: validationData,
          validation_upload_date: new Date().toISOString(),
          validation_report_id: validationData.reportId,
          comparison_results: comparison,
          area_error_percent: Math.abs(comparison.areaErrorPercent),
          overall_accuracy_score: comparison.overallScore
        })
        .eq('id', predictionId);

      if (error) {
        console.error('Error updating analysis:', error);
        throw error;
      }

      console.log('Analysis updated with validation data');
    } catch (error) {
      console.error('Error updating analysis with validation data:', error);
      throw error;
    }
  }
}