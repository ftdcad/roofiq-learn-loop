import { supabase } from '@/integrations/supabase/client';
import { RoofPrediction, TrainingProgress } from '@/types/roof-analysis';

export class RoofAnalysisService {
  static async analyzeRoof(address: string, satelliteImage?: string): Promise<RoofPrediction> {
    try {
      console.log('Starting roof analysis for:', address);
      
      const { data, error } = await supabase.functions.invoke('analyze-roof', {
        body: { address, satelliteImage }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Analysis failed: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      // Convert the response to our RoofPrediction format
      const prediction: RoofPrediction = {
        id: data.analysisId || crypto.randomUUID(),
        address,
        coordinates: { lat: 40.7128, lng: -74.0060 }, // Default coordinates
        satelliteImage,
        predictionDate: new Date(),
        prediction: data.prediction
      };

      console.log('Roof analysis completed successfully');
      return prediction;

    } catch (error) {
      console.error('Error in roof analysis:', error);
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