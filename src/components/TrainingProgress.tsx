import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Brain, Zap } from 'lucide-react';
import { TrainingProgress as TrainingProgressType } from '@/types/roof-analysis';

interface TrainingProgressProps {
  progress: TrainingProgressType;
}

export const TrainingProgress: React.FC<TrainingProgressProps> = ({ progress }) => {
  const progressPercentage = (progress.totalComparisons / progress.targetComparisons) * 100;
  
  return (
    <Card className="roofiq-card border-roofiq-blue/20">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Brain className="w-6 h-6 text-roofiq-blue" />
              AI Training Progress
            </h2>
            <p className="text-muted-foreground mt-1">
              Every comparison makes our AI smarter
            </p>
          </div>
          <Badge variant="secondary" className="bg-roofiq-blue/10 text-roofiq-blue border-roofiq-blue/20">
            Model v{progress.modelVersion}
          </Badge>
        </div>
        
        <div className="space-y-6">
          {/* Main Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">
                Training Progress
              </span>
              <span className="text-sm text-muted-foreground">
                {progress.totalComparisons} / {progress.targetComparisons} comparisons
              </span>
            </div>
            <Progress 
              value={progressPercentage}
              className="h-3 bg-muted"
            />
            <div className="mt-2 text-xs text-muted-foreground">
              {Math.round(progressPercentage)}% complete
            </div>
          </div>
          
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-roofiq-green/10 border border-roofiq-green/20">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-roofiq-green" />
              </div>
              <div className="text-2xl font-bold text-roofiq-green">
                {progress.averageAccuracy}%
              </div>
              <div className="text-xs text-muted-foreground">Avg Accuracy</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-roofiq-blue/10 border border-roofiq-blue/20">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-roofiq-blue" />
              </div>
              <div className="text-2xl font-bold text-roofiq-blue">
                {progress.facetDetectionRate}%
              </div>
              <div className="text-xs text-muted-foreground">Facet Detection</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-roofiq-amber/10 border border-roofiq-amber/20">
              <div className="flex items-center justify-center mb-2">
                <Zap className="w-5 h-5 text-roofiq-amber" />
              </div>
              <div className="text-2xl font-bold text-roofiq-amber">
                {progress.areaAccuracy}%
              </div>
              <div className="text-xs text-muted-foreground">Area Accuracy</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-secondary border border-border">
              <div className="flex items-center justify-center mb-2">
                <Brain className="w-5 h-5 text-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {progress.estimatedDaysToTarget}
              </div>
              <div className="text-xs text-muted-foreground">Days to target</div>
            </div>
          </div>
          
          {/* Remaining Comparisons */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Remaining comparisons needed:
            </span>
            <span className="font-mono text-foreground font-semibold">
              {progress.targetComparisons - progress.totalComparisons}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};