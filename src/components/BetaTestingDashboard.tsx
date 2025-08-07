import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload } from '@/components/ui/upload';
import { useToast } from '@/hooks/use-toast';
import { TrainingProgress } from '@/components/TrainingProgress';
import { AddressInput } from '@/components/AddressInput';
import { RoofVisualization } from '@/components/RoofVisualization';
import { ComparisonMetrics } from '@/components/ComparisonMetrics';
import { Upload as UploadIcon, Lightbulb, Sparkles, CheckCircle } from 'lucide-react';
import { RoofPrediction } from '@/types/roof-analysis';
import { generateMockPrediction, generateMockComparison, getMockTrainingProgress } from '@/services/mockData';
import confetti from 'canvas-confetti';

export const BetaTestingDashboard: React.FC = () => {
  const [currentPrediction, setCurrentPrediction] = useState<RoofPrediction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(getMockTrainingProgress());
  const { toast } = useToast();

  const handleAddressSubmit = async (address: string) => {
    setIsAnalyzing(true);
    
    try {
      // Simulate AI analysis delay
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const prediction = generateMockPrediction(address);
      setCurrentPrediction(prediction);
      
      toast({
        title: "Analysis Complete!",
        description: `Roof analysis finished with ${prediction.prediction.confidence.toFixed(1)}% confidence. Upload EagleView report to help train our AI!`,
      });
      
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Please try again with a different address.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEagleViewUpload = async (file: File) => {
    if (!currentPrediction) return;
    
    setIsProcessingUpload(true);
    
    try {
      // Simulate PDF processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const { eagleViewData, comparison } = generateMockComparison(currentPrediction);
      
      // Update prediction with comparison data
      const updatedPrediction = {
        ...currentPrediction,
        eagleViewData,
        comparison
      };
      
      setCurrentPrediction(updatedPrediction);
      
      // Update training progress
      setTrainingProgress(prev => ({
        ...prev,
        totalComparisons: prev.totalComparisons + 1,
        averageAccuracy: prev.averageAccuracy + (comparison.overallScore - prev.averageAccuracy) * 0.1
      }));
      
      // Celebration effects
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      toast({
        title: "🎉 AI Learning Complete!",
        description: `Accuracy: ${comparison.overallScore.toFixed(1)}%. Our AI just got smarter!`,
      });
      
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to parse EagleView report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingUpload(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-xl bg-roofiq-blue/10 roofiq-glow">
              <Sparkles className="w-8 h-8 text-roofiq-blue" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                RoofIQ Learning Engine
              </h1>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="px-3 py-1 rounded-full bg-roofiq-amber/10 text-roofiq-amber text-sm font-medium border border-roofiq-amber/20">
                  Beta
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">Every comparison makes our AI smarter</span>
              </div>
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Advanced AI-powered roof measurement system that learns from professional EagleView reports. 
            Target: <span className="text-roofiq-green font-semibold">95% accuracy</span> with 3,000+ comparisons.
          </p>
        </div>

        {/* Training Progress */}
        <TrainingProgress progress={trainingProgress} />

        {/* Address Input */}
        <AddressInput 
          onSubmit={handleAddressSubmit}
          isLoading={isAnalyzing}
        />

        {/* Results Grid */}
        {currentPrediction && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Prediction */}
            <Card className="roofiq-card">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-foreground">
                    RoofIQ Analysis
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-roofiq-green animate-pulse"></div>
                    <span className="text-sm text-muted-foreground">AI Active</span>
                  </div>
                </div>
                
                <RoofVisualization 
                  prediction={currentPrediction}
                  showConfidence={true}
                />
              </div>
            </Card>

            {/* EagleView Upload or Comparison */}
            <Card className="roofiq-card">
              <div className="p-6">
                {!currentPrediction.eagleViewData ? (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg bg-roofiq-green/10">
                        <Lightbulb className="w-6 h-6 text-roofiq-green" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">
                          Help Us Learn
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Upload EagleView report to improve accuracy
                        </p>
                      </div>
                    </div>
                    
                    <Upload
                      accept=".pdf"
                      onUpload={handleEagleViewUpload}
                      className="border-2 border-dashed border-roofiq-blue/30 hover:border-roofiq-blue/50 transition-colors"
                      disabled={isProcessingUpload}
                    >
                      <div className="text-center py-12">
                        <UploadIcon className={`w-12 h-12 text-muted-foreground mx-auto mb-4 ${isProcessingUpload ? 'animate-bounce' : ''}`} />
                        <p className="text-foreground font-medium mb-2">
                          {isProcessingUpload ? 'Processing EagleView Report...' : 'Upload EagleView Report'}
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Drag and drop your PDF or click to browse
                        </p>
                        <div className="flex items-center justify-center gap-2 text-xs text-roofiq-green">
                          <CheckCircle className="w-4 h-4" />
                          <span>Each upload improves accuracy by ~0.1%</span>
                        </div>
                      </div>
                    </Upload>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg bg-roofiq-green/10">
                        <CheckCircle className="w-6 h-6 text-roofiq-green" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">
                          Comparison Results
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Analysis vs EagleView Report #{currentPrediction.eagleViewData.reportId}
                        </p>
                      </div>
                    </div>
                    
                    <ComparisonMetrics 
                      prediction={currentPrediction.prediction}
                      actual={currentPrediction.eagleViewData}
                      comparison={currentPrediction.comparison}
                    />
                  </>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Learning Insights */}
        {currentPrediction?.comparison && (
          <Card className="roofiq-card animate-slide-up">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-roofiq-amber/10">
                  <Lightbulb className="w-6 h-6 text-roofiq-amber" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    What We Learned
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    AI insights from this comparison
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-roofiq-blue/10 border border-roofiq-blue/20">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-roofiq-blue mt-0.5" />
                    <div>
                      <p className="text-foreground font-medium">Pattern Recognition Improved</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Added new training data for {currentPrediction.prediction.predominantPitch} pitch roofs 
                        in residential areas. Model confidence will improve for similar properties.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-roofiq-green/10 border border-roofiq-green/20">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-roofiq-green mt-0.5" />
                    <div>
                      <p className="text-foreground font-medium">Feature Detection Enhanced</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Fine-tuned facet boundary detection algorithm. 
                        Next predictions will better identify dormers and roof additions.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="text-center pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    This comparison was automatically added to our training dataset. 
                    <span className="text-roofiq-blue font-medium">Model v{trainingProgress.modelVersion}</span> will be updated in the next training cycle.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};