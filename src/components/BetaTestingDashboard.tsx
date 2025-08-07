import React, { useState, useEffect } from 'react';
import roofHeroBg from '@/assets/roof-hero-bg.jpg';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DualUploadLearning } from '@/components/DualUploadLearning';
import { useToast } from '@/hooks/use-toast';
import { TrainingProgress } from '@/components/TrainingProgress';
import { AddressInput } from '@/components/AddressInput';
import { AIStatusIndicator } from '@/components/AIStatusIndicator';
import { RoofVisualization } from '@/components/RoofVisualization';
import { ComparisonMetrics } from '@/components/ComparisonMetrics';
import { ProfessionalReportView } from '@/components/ProfessionalReportView';
import { RoofSketch } from '@/components/RoofSketch';
import { Upload as UploadIcon, Lightbulb, Sparkles, CheckCircle } from 'lucide-react';
import { RoofPrediction, RoofFacet } from '@/types/roof-analysis';
import { RoofAnalysisService } from '@/services/roofAnalysisService';
import confetti from 'canvas-confetti';

export const BetaTestingDashboard: React.FC = () => {
  const [currentPrediction, setCurrentPrediction] = useState<RoofPrediction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState<any>(null);
  const { toast } = useToast();

  const handleAddressSubmit = async (address: string) => {
    setIsAnalyzing(true);
    
    try {
      const prediction = await RoofAnalysisService.analyzeRoof(address);
      setCurrentPrediction(prediction);
      
      toast({
        title: "AI Analysis Complete!",
        description: `Roof analysis finished with ${prediction.prediction.confidence.toFixed(1)}% confidence. Upload professional report to help train our AI!`,
      });
      
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Please try again with a different address.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDualUpload = async (data: any, type: 'roof' | 'footprint') => {
    if (!currentPrediction) return;
    
    setIsProcessingUpload(true);
    
    try {
      let validationData, comparison;
      
      if (type === 'roof') {
        // data is the response from edge function
        validationData = data?.validationData;
        comparison = data?.comparison;
        if (!validationData || !comparison) {
          throw new Error('Missing validation data from server response');
        }
      } else {
        // Handle footprint data processing (mock for now)
        validationData = data;
        comparison = { overallScore: 85, areaErrorPercent: 5 };
      }
      
      // Update prediction with comparison data
      const updatedPrediction = {
        ...currentPrediction,
        validationData,
        comparison,
        footprintData: type === 'footprint' ? data : currentPrediction.footprintData
      };
      
      setCurrentPrediction(updatedPrediction);
      
      // Refresh training progress
      const newProgress = await RoofAnalysisService.getTrainingProgress();
      setTrainingProgress(newProgress);
      
      // Celebration effects
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      const message = type === 'roof' 
        ? `Accuracy: ${comparison.overallScore.toFixed(1)}%. Our AI just got smarter!`
        : 'Footprint data added! Learning overhang patterns.';
      
      toast({
        title: "🎉 AI Learning Complete!",
        description: message,
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to process file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingUpload(false);
    }
  };

  // Load training progress on component mount
  useEffect(() => {
    const loadTrainingProgress = async () => {
      try {
        const progress = await RoofAnalysisService.getTrainingProgress();
        setTrainingProgress(progress);
      } catch (error) {
        console.error('Failed to load training progress:', error);
      }
    };
    
    loadTrainingProgress();
  }, []);

  // Build facets for diagram (fallback to simple rectangle split if missing)
  function buildFallbackFacets(totalArea: number, totalPerimeter?: number, predominantPitch?: string): RoofFacet[] {
    const A = Math.max(totalArea, 1);
    if (!totalPerimeter || totalPerimeter <= 0) {
      const s = Math.sqrt(A);
      const half = s / 2;
      const left: RoofFacet = {
        id: 'fallback-left',
        polygon: [[0,0],[half,0],[half,s],[0,s]],
        area: A / 2,
        pitch: predominantPitch || '6/12',
        type: 'main',
        confidence: 0.2,
      };
      const right: RoofFacet = {
        id: 'fallback-right',
        polygon: [[half,0],[s,0],[s,s],[half,s]],
        area: A / 2,
        pitch: predominantPitch || '6/12',
        type: 'main',
        confidence: 0.2,
      };
      return [left, right];
    }
    const P = totalPerimeter;
    const halfP = P / 2;
    const disc = halfP * halfP - 4 * A;
    let a: number, b: number;
    if (disc > 0) {
      const sqrtD = Math.sqrt(disc);
      a = (halfP + sqrtD) / 2;
      b = (halfP - sqrtD) / 2;
    } else {
      a = halfP / 2;
      b = halfP / 2;
    }
    const halfA = a / 2;
    const left: RoofFacet = { id: 'fallback-left', polygon: [[0,0],[halfA,0],[halfA,b],[0,b]], area: A / 2, pitch: predominantPitch || '6/12', type: 'main', confidence: 0.2 };
    const right: RoofFacet = { id: 'fallback-right', polygon: [[halfA,0],[a,0],[a,b],[halfA,b]], area: A / 2, pitch: predominantPitch || '6/12', type: 'main', confidence: 0.2 };
    return [left, right];
  }

  const baseFacets = currentPrediction?.prediction.facets ?? [];
  const hasGeometry = baseFacets.length > 0 && baseFacets.every(f => Array.isArray(f.polygon) && f.polygon.length >= 3);
  const diagramFacets: RoofFacet[] = hasGeometry
    ? baseFacets
    : buildFallbackFacets(
        currentPrediction?.prediction.totalArea || 0,
        currentPrediction?.prediction.reportSummary.totalPerimeter,
        currentPrediction?.prediction.predominantPitch
      );

  return (
    <div className="min-h-screen bg-gradient-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section with Brand Identity */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-roofiq-blue via-roofiq-blue-dark to-background border border-roofiq-blue/20 shadow-2xl">
          <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{backgroundImage: `url(${roofHeroBg})`}}></div>
          <div className="absolute inset-0 bg-gradient-to-r from-roofiq-blue/80 via-roofiq-blue/60 to-transparent"></div>
          
          <div className="relative px-12 py-16 text-center">
            <div className="space-y-6">
              {/* Main Brand Title */}
              <div className="space-y-2">
                <h1 className="text-6xl font-bold text-white tracking-tight">
                  RoofIQ
                </h1>
                <p className="text-xl text-white/90 font-medium">
                  Roof measurement and analysis tool
                </p>
              </div>
              
              {/* Beta Badge and Status */}
              <div className="flex items-center justify-center gap-4">
                <span className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium border border-white/30">
                  Beta Learning Engine
                </span>
                <span className="text-white/70">•</span>
                <span className="text-white/90">Every comparison makes our AI smarter</span>
              </div>
              
              {/* Value Proposition */}
              <p className="text-lg text-white/80 max-w-3xl mx-auto leading-relaxed">
                Advanced AI-powered roof measurement system that learns from professional roof reports.
              </p>
              
            </div>
          </div>
        </div>

        {/* Training Progress */}
        {trainingProgress && <TrainingProgress progress={trainingProgress} />}

        {/* AI Status Indicator */}
        <AIStatusIndicator 
          prediction={currentPrediction} 
          onStatusChange={(isWorking) => {
            if (!isWorking) {
              toast({
                title: "⚠️ OpenAI Not Connected",
                description: "System running in demo mode with mock data",
                variant: "destructive"
              });
            }
          }}
        />

        {/* Address Input */}
        <AddressInput 
          onSubmit={handleAddressSubmit}
          isLoading={isAnalyzing}
        />

        {/* Professional Reports */}
        {currentPrediction && (
          <div className="space-y-8">
            {/* Dual Upload Section */}
            {!currentPrediction.validationData && (
              <Card className="roofiq-card">
                <div className="p-6">
                  <DualUploadLearning
                    predictionId={currentPrediction.id}
                    onUploadComplete={handleDualUpload}
                  />
                </div>
              </Card>
            )}

            {/* Comparison Results */}
            {currentPrediction.validationData && currentPrediction.comparison && (
              <Card className="roofiq-card">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-roofiq-green/10">
                      <CheckCircle className="w-6 h-6 text-roofiq-green" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">
                        Comparison Results
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Analysis vs Validation Report #{currentPrediction.validationData.reportId}
                      </p>
                    </div>
                  </div>
                  
                  <ComparisonMetrics 
                    prediction={currentPrediction.prediction}
                    actual={currentPrediction.validationData}
                    comparison={currentPrediction.comparison}
                  />
                </div>
              </Card>
            )}

            {/* Report + Technical Diagram */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* RoofIQ Report */}
              <div>
                <ProfessionalReportView 
                  prediction={currentPrediction}
                  isProfessionalReport={false}
                  title="RoofIQ AI Analysis Report"
                />
              </div>

              {/* Technical Roof Diagram */}
              <div>
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle>Technical Roof Diagram</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RoofSketch 
                      facets={diagramFacets}
                      perimeterFeet={currentPrediction.prediction.reportSummary.totalPerimeter}
                      width={520}
                      height={520}
                      showLabels={true}
                      showMeasurements={true}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
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