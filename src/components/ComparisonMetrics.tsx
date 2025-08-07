import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, TrendingUp, Target } from 'lucide-react';
import { RoofPrediction } from '@/types/roof-analysis';

interface ComparisonMetricsProps {
  prediction: RoofPrediction['prediction'];
  actual: RoofPrediction['validationData'];
  comparison: RoofPrediction['comparison'];
}

export const ComparisonMetrics: React.FC<ComparisonMetricsProps> = ({ 
  prediction, 
  actual, 
  comparison 
}) => {
  if (!actual || !comparison) return null;

  const getAccuracyColor = (score: number) => {
    if (score >= 90) return 'text-roofiq-green';
    if (score >= 75) return 'text-roofiq-amber';
    return 'text-roofiq-red';
  };

  const getAccuracyIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-5 h-5 text-roofiq-green" />;
    if (score >= 75) return <AlertCircle className="w-5 h-5 text-roofiq-amber" />;
    return <XCircle className="w-5 h-5 text-roofiq-red" />;
  };

  const formatDifference = (predicted: number, actual: number, unit: string = '') => {
    const diff = predicted - actual;
    const percentage = ((Math.abs(diff) / actual) * 100).toFixed(1);
    const sign = diff >= 0 ? '+' : '';
    return {
      absolute: `${sign}${diff.toFixed(0)}${unit}`,
      percentage: `${percentage}%`,
      isPositive: diff >= 0
    };
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="text-center p-6 rounded-lg bg-secondary border border-border">
        <div className="flex items-center justify-center mb-2">
          {getAccuracyIcon(comparison.overallScore)}
        </div>
        <div className={`text-3xl font-bold ${getAccuracyColor(comparison.overallScore)}`}>
          {comparison.overallScore}%
        </div>
        <div className="text-sm text-muted-foreground">Overall Accuracy</div>
      </div>

      {/* Detailed Comparisons */}
      <div className="space-y-4">
        {/* Area Comparison */}
        <div className="p-4 rounded-lg bg-secondary border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-foreground">Total Area</span>
            <Badge variant="outline" className={`${Math.abs(comparison.areaErrorPercent) <= 5 ? 'bg-roofiq-green/10 text-roofiq-green border-roofiq-green/20' : 'bg-roofiq-red/10 text-roofiq-red border-roofiq-red/20'}`}>
              {comparison.areaErrorPercent > 0 ? '+' : ''}{comparison.areaErrorPercent.toFixed(1)}%
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Predicted</div>
              <div className="font-mono font-semibold text-foreground">
                {prediction.totalArea.toLocaleString()} sq ft
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Actual (Professional)</div>
              <div className="font-mono font-semibold text-foreground">
                {actual.totalArea.toLocaleString()} sq ft
              </div>
            </div>
          </div>
        </div>

        {/* Facet Count Comparison */}
        <div className="p-4 rounded-lg bg-secondary border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-foreground">Facet Count</span>
            <Badge variant="outline" className={`${prediction.facets.length === actual.facets.length ? 'bg-roofiq-green/10 text-roofiq-green border-roofiq-green/20' : 'bg-roofiq-amber/10 text-roofiq-amber border-roofiq-amber/20'}`}>
              {prediction.facets.length === actual.facets.length ? 'Perfect Match' : `${prediction.facets.length - actual.facets.length > 0 ? '+' : ''}${prediction.facets.length - actual.facets.length}`}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Predicted</div>
              <div className="font-mono font-semibold text-foreground">
                {prediction.facets.length} facets
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Actual (Professional)</div>
              <div className="font-mono font-semibold text-foreground">
                {actual.facets.length} facets
              </div>
            </div>
          </div>
        </div>

        {/* Accuracy Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-secondary border border-border text-center">
            <div className={`text-xl font-bold ${getAccuracyColor(comparison.facetAccuracy)}`}>
              {comparison.facetAccuracy}%
            </div>
            <div className="text-xs text-muted-foreground">Facet Detection</div>
          </div>
          <div className="p-3 rounded-lg bg-secondary border border-border text-center">
            <div className={`text-xl font-bold ${getAccuracyColor(comparison.measurementAccuracy)}`}>
              {comparison.measurementAccuracy}%
            </div>
            <div className="text-xs text-muted-foreground">Measurements</div>
          </div>
        </div>
      </div>

      {/* Learning Insights */}
      {comparison.missedFeatures && comparison.missedFeatures.length > 0 && (
        <div className="p-4 rounded-lg bg-roofiq-amber/10 border border-roofiq-amber/20">
          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-roofiq-amber" />
            Areas for Improvement
          </h4>
          <ul className="space-y-2">
            {comparison.missedFeatures.map((feature, index) => (
              <li key={index} className="text-sm text-foreground flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-roofiq-amber mt-0.5 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};