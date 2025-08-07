import { supabase } from '@/integrations/supabase/client';

export interface QualityChecks {
  physicallyPossible: boolean;
  internalConsistency: boolean;
  outlierDetection: boolean;
  confidenceCalibration: number;
}

export interface LearningEvent {
  predictionId: string;
  eventType: 'prediction' | 'comparison' | 'improvement' | 'error_analysis';
  accuracyDelta?: number;
  patternsLearned?: any;
  metadata?: any;
}

export interface SystemMetrics {
  dailyPredictions: number;
  averageProcessingTimeMs: number;
  errorRate: number;
  learningVelocity: number;
  costPerPrediction: number;
}

export class QualityAssuranceService {
  /**
   * Perform quality checks on a prediction
   */
  static async performQualityChecks(prediction: any): Promise<QualityChecks> {
    const checks: QualityChecks = {
      physicallyPossible: this.checkPhysicallyPossible(prediction),
      internalConsistency: this.checkInternalConsistency(prediction),
      outlierDetection: this.checkOutlierDetection(prediction),
      confidenceCalibration: this.calculateConfidenceCalibration(prediction)
    };

    // Store quality check results
    await supabase.from('quality_checks').insert({
      prediction_id: prediction.id,
      physically_possible: checks.physicallyPossible,
      internal_consistency: checks.internalConsistency,
      outlier_detection: checks.outlierDetection,
      confidence_calibration: checks.confidenceCalibration,
      validation_notes: this.generateValidationNotes(checks)
    });

    return checks;
  }

  /**
   * Check if prediction is physically possible
   */
  private static checkPhysicallyPossible(prediction: any): boolean {
    const { totalArea } = prediction.prediction;
    
    // Residential roofs typically range from 500 to 15,000 sq ft
    if (totalArea < 500 || totalArea > 15000) {
      return false;
    }

    // Check if squares calculation makes sense
    const calculatedSquares = totalArea / 100;
    const predictionSquares = prediction.prediction.squares;
    
    if (Math.abs(calculatedSquares - predictionSquares) > 5) {
      return false;
    }

    return true;
  }

  /**
   * Check internal consistency of measurements
   */
  private static checkInternalConsistency(prediction: any): boolean {
    const { facets, totalArea } = prediction.prediction;
    
    // Sum of facet areas should roughly equal total area
    const facetAreaSum = facets.reduce((sum: number, facet: any) => sum + facet.area, 0);
    const areaVariance = Math.abs(facetAreaSum - totalArea) / totalArea;
    
    return areaVariance < 0.15; // 15% tolerance
  }

  /**
   * Detect if prediction is an outlier
   */
  private static checkOutlierDetection(prediction: any): boolean {
    // This would typically compare against neighborhood data
    // For now, flag predictions that are extremely unusual
    const { totalArea, confidence } = prediction.prediction;
    
    // Very large area with high confidence might be suspicious
    if (totalArea > 8000 && confidence > 90) {
      return true;
    }

    // Very small area with high confidence might also be suspicious
    if (totalArea < 1000 && confidence > 90) {
      return true;
    }

    return false;
  }

  /**
   * Calculate confidence calibration score
   */
  private static calculateConfidenceCalibration(prediction: any): number {
    // This would typically be based on historical accuracy data
    // For now, return a basic calibration score
    const confidence = prediction.prediction.confidence;
    
    // Adjust confidence based on complexity
    const complexityFactor = prediction.prediction.facets.length > 10 ? 0.9 : 1.0;
    
    return confidence * complexityFactor;
  }

  /**
   * Generate validation notes
   */
  private static generateValidationNotes(checks: QualityChecks): string {
    const notes = [];
    
    if (!checks.physicallyPossible) {
      notes.push("Prediction outside typical residential roof range");
    }
    
    if (!checks.internalConsistency) {
      notes.push("Facet areas don't sum to total area");
    }
    
    if (checks.outlierDetection) {
      notes.push("Prediction flagged as potential outlier");
    }

    if (checks.confidenceCalibration < 70) {
      notes.push("Low confidence calibration score");
    }

    return notes.join("; ") || "All quality checks passed";
  }
}

export class LearningService {
  /**
   * Track a learning event
   */
  static async trackLearningEvent(event: LearningEvent): Promise<void> {
    try {
      await supabase.from('learning_events').insert({
        prediction_id: event.predictionId,
        event_type: event.eventType,
        accuracy_delta: event.accuracyDelta,
        patterns_learned: event.patternsLearned,
        metadata: event.metadata
      });

      console.log(`Learning event tracked: ${event.eventType} for prediction ${event.predictionId}`);
    } catch (error) {
      console.error('Error tracking learning event:', error);
    }
  }

  /**
   * Update system metrics
   */
  static async updateSystemMetrics(metrics: Partial<SystemMetrics>): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      await supabase.from('system_metrics').upsert({
        metric_date: today,
        daily_predictions: metrics.dailyPredictions,
        average_processing_time_ms: metrics.averageProcessingTimeMs,
        error_rate: metrics.errorRate,
        learning_velocity: metrics.learningVelocity,
        cost_per_prediction: metrics.costPerPrediction,
        metadata: { updated_at: new Date().toISOString() }
      });
    } catch (error) {
      console.error('Error updating system metrics:', error);
    }
  }

  /**
   * Get learning progress analytics
   */
  static async getLearningProgress(): Promise<any> {
    try {
      const { data: events } = await supabase
        .from('learning_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      const { data: metrics } = await supabase
        .from('system_metrics')
        .select('*')
        .order('metric_date', { ascending: false })
        .limit(30);

      return {
        recentEvents: events || [],
        systemMetrics: metrics || [],
        totalEvents: events?.length || 0,
        improvementTrend: this.calculateImprovementTrend(events || [])
      };
    } catch (error) {
      console.error('Error getting learning progress:', error);
      return null;
    }
  }

  /**
   * Calculate improvement trend from learning events
   */
  private static calculateImprovementTrend(events: any[]): number {
    if (events.length < 2) return 0;

    const improvementEvents = events.filter(e => e.event_type === 'improvement' && e.accuracy_delta);
    
    if (improvementEvents.length === 0) return 0;

    const avgImprovement = improvementEvents.reduce((sum, event) => sum + event.accuracy_delta, 0) / improvementEvents.length;
    
    return avgImprovement;
  }
}