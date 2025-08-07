import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Home, Layers, Calculator, TrendingUp } from 'lucide-react';
import { RoofPrediction } from '@/types/roof-analysis';

interface RoofVisualizationProps {
  prediction: RoofPrediction;
  showConfidence?: boolean;
}

export const RoofVisualization: React.FC<RoofVisualizationProps> = ({ 
  prediction, 
  showConfidence = true 
}) => {
  const { prediction: pred } = prediction;
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-roofiq-green';
    if (confidence >= 70) return 'text-roofiq-amber';
    return 'text-roofiq-red';
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 85) return 'bg-roofiq-green/10 border-roofiq-green/20';
    if (confidence >= 70) return 'bg-roofiq-amber/10 border-roofiq-amber/20';
    return 'bg-roofiq-red/10 border-roofiq-red/20';
  };

  return (
    <div className="space-y-4">
      {/* Confidence Score */}
      {showConfidence && (
        <div className={`p-4 rounded-lg border ${getConfidenceBg(pred.confidence)}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Prediction Confidence</span>
            <span className={`text-lg font-bold ${getConfidenceColor(pred.confidence)}`}>
              {pred.confidence}%
            </span>
          </div>
          <Progress value={pred.confidence} className="h-2" />
        </div>
      )}

      {/* Satellite View Placeholder */}
      <div className="relative bg-muted rounded-lg h-48 flex items-center justify-center border border-border">
        <div className="text-center">
          <Home className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Satellite View</p>
          <p className="text-xs text-muted-foreground">{prediction.address}</p>
        </div>
        
        {/* Facet Overlay */}
        <div className="absolute inset-2 rounded border-2 border-dashed border-roofiq-blue/50">
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-roofiq-blue/20 text-roofiq-blue text-xs">
              {pred.facets.length} facets detected
            </Badge>
          </div>
        </div>
      </div>

      {/* Key Measurements */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-secondary border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Calculator className="w-4 h-4 text-roofiq-blue" />
            <span className="text-xs font-medium text-muted-foreground">Total Area</span>
          </div>
          <div className="text-lg font-bold text-foreground font-mono">
            {pred.totalArea.toLocaleString()} sq ft
          </div>
        </div>
        
        <div className="p-3 rounded-lg bg-secondary border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-roofiq-green" />
            <span className="text-xs font-medium text-muted-foreground">Squares</span>
          </div>
          <div className="text-lg font-bold text-foreground font-mono">
            {pred.squares.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Measurements Details */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">Linear Measurements</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ridges:</span>
            <span className="font-mono text-foreground">{pred.measurements.ridges} ft</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valleys:</span>
            <span className="font-mono text-foreground">{pred.measurements.valleys} ft</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hips:</span>
            <span className="font-mono text-foreground">{pred.measurements.hips} ft</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rakes:</span>
            <span className="font-mono text-foreground">{pred.measurements.rakes} ft</span>
          </div>
          <div className="flex justify-between col-span-2">
            <span className="text-muted-foreground">Eaves:</span>
            <span className="font-mono text-foreground">{pred.measurements.eaves} ft</span>
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="pt-3 border-t border-border space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Predominant Pitch:</span>
          <span className="font-medium text-foreground">{pred.predominantPitch}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Waste Factor:</span>
          <span className="font-medium text-foreground">{pred.wasteFactor}%</span>
        </div>
      </div>
    </div>
  );
};