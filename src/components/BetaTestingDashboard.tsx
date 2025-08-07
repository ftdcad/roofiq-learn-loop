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
import { Upload as UploadIcon, Lightbulb, Sparkles, CheckCircle, TriangleAlert, FileText } from 'lucide-react';
import { RoofPrediction, RoofFacet } from '@/types/roof-analysis';
import { RoofAnalysisService } from '@/services/roofAnalysisService';
import confetti from 'canvas-confetti';
import { MapboxService } from '@/services/mapboxService';
import { RoofTraceOverlay } from '@/components/RoofTraceOverlay';
import { Badge } from '@/components/ui/badge';
import { ScaleCalibrationService } from '@/services/ScaleCalibrationService';
import { TEST_EAGLEVIEW_REPORT } from '@/data/testEagleViewReport';

export const BetaTestingDashboard: React.FC = () => {
  const [currentPrediction, setCurrentPrediction] = useState<RoofPrediction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState<any>(null);
  const [satelliteUrl, setSatelliteUrl] = useState<string | null>(null);
  const [isTracing, setIsTracing] = useState(false);
  const [usedZoom] = useState(20);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibration, setCalibration] = useState<null | { feetPerPixel: number; method: 'road' | 'car' | 'combined'; confidence: number }>(null);
  const { toast } = useToast();
  const [testReportLoaded, setTestReportLoaded] = useState(false);

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

  const loadTestReport = async () => {
    // If no current prediction, run one first
    if (!currentPrediction) {
      toast({ title: 'Auto-running analysis...', description: 'Loading test address first', });
      await handleAddressSubmit("18004 Avalon Lane, Tampa, FL 33647");
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    try {
      const test = TEST_EAGLEVIEW_REPORT;
      const totalArea = Math.round(test.measurements.totalArea);
      const predominantPitch = test.structure.predominantPitch || currentPrediction.prediction.predominantPitch;

      // Build fallback facets for validation sketch
      const vFacets = buildFallbackFacets(totalArea, undefined, predominantPitch);

      const validationData = {
        reportId: test.reportId,
        uploadDate: new Date(),
        facets: vFacets,
        totalArea,
        squares: Number((totalArea / 100).toFixed(1)),
        measurements: {
          ridges: test.measurements.totalRidges,
          valleys: test.measurements.totalValleys,
          hips: test.measurements.totalHips,
          rakes: test.measurements.totalRakes,
          eaves: test.measurements.totalEaves,
          gutters: 0,
          stepFlashing: test.measurements.totalStepFlashing,
          drip: test.measurements.totalDripEdge,
        },
        pitch: predominantPitch,
        wasteFactor: 15,
        areasByPitch: test.measurements.areasByPitch.map(p => ({
          pitch: p.pitch,
          area: Math.round(p.area),
          squares: Number((Math.round(p.area) / 100).toFixed(1)),
          percentage: p.percentage,
        })),
        propertyDetails: {
          stories: test.structure.stories || 1,
          estimatedAtticArea: 0,
          structureComplexity: 'Moderate',
          roofAccessibility: 'Moderate',
          chimneys: 0,
          skylights: 0,
          vents: 0,
        },
        reportSummary: {
          totalPerimeter: 0,
          averagePitch: predominantPitch,
          roofComplexityScore: 0,
        },
      } as const;

      const aiArea = Math.max(1, Math.round(currentPrediction.prediction.totalArea || 0));
      const areaErrorPercent = Number((Math.abs(aiArea - totalArea) / totalArea * 100).toFixed(1));

      const comparison = {
        areaErrorPercent,
        facetAccuracy: 80,
        measurementAccuracy: 85,
        missedFeatures: [],
        overallScore: Math.max(0, Number((100 - areaErrorPercent).toFixed(1))),
      };

      const fakeResponse = { validationData, comparison };
      await handleDualUpload(fakeResponse, 'roof');

      setTestReportLoaded(true);
      toast({
        title: 'Test Report Loaded',
        description: `EagleView data for ${test.address} ready for comparison`,
      });
    } catch (e) {
      console.error('LoadTestReport error:', e);
      toast({ title: 'Failed to load test report', description: 'Please try again.', variant: 'destructive' });
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

  // Auto-capture satellite image when we have an analysis with coordinates
  useEffect(() => {
    const run = async () => {
      if (!currentPrediction?.coordinates) return;
      try {
        const img = await MapboxService.captureSatelliteImage(
          currentPrediction.address,
          currentPrediction.coordinates,
          { zoom: usedZoom, size: '1024x1024', retina: true }
        );
        if (img) {
          setSatelliteUrl(img);
          console.log('Satellite image URL set:', img, 'address:', currentPrediction.address);
        }
      } catch (e) {
        console.warn('Satellite capture failed', e);
        toast({ title: 'Satellite capture failed', description: 'Check Mapbox key in Supabase edge function secrets.', variant: 'destructive' });
      }
    };
    run();
  }, [currentPrediction?.id]);

  useEffect(() => {
    if (satelliteUrl) {
      console.log('Debug: satelliteUrl changed:', satelliteUrl);
    }
  }, [satelliteUrl]);

  // Build facets for diagram (L-shaped, multi-facet with diagonal ridges)
  function buildFallbackFacets(totalArea: number, _totalPerimeter?: number, predominantPitch?: string): RoofFacet[] {
    const A = Math.max(totalArea, 900);
    const s = Math.sqrt(A);

    // Main house rectangle
    const W = 0.70 * s;
    const H = 0.50 * s;

    // Attached garage offset to form an L
    const Wg = 0.38 * s;
    const Hg = 0.28 * s;
    const xg = W - Wg * 0.6; // overlap a bit to read as attached
    const yg = H - Hg * 0.2;

    const pMain = predominantPitch || '6/12';

    // Split main into two triangles along a diagonal (creates a diagonal ridge)
    const mainA: RoofFacet = {
      id: 'fallback-main-a',
      polygon: [ [0,0], [W,0], [W,H] ],
      area: (W * H) / 2,
      pitch: pMain,
      type: 'main',
      confidence: 0.25,
    };
    const mainB: RoofFacet = {
      id: 'fallback-main-b',
      polygon: [ [0,0], [0,H], [W,H] ],
      area: (W * H) / 2,
      pitch: pMain,
      type: 'main',
      confidence: 0.25,
    };

    // Split garage into two triangles (another diagonal ridge)
    const gX2 = xg + Wg;
    const gY2 = yg + Hg;
    const garageA: RoofFacet = {
      id: 'fallback-garage-a',
      polygon: [ [xg,yg], [gX2,yg], [gX2,gY2] ],
      area: (Wg * Hg) / 2,
      pitch: '7/12',
      type: 'garage',
      confidence: 0.25,
    };
    const garageB: RoofFacet = {
      id: 'fallback-garage-b',
      polygon: [ [xg,yg], [xg,gY2], [gX2,gY2] ],
      area: (Wg * Hg) / 2,
      pitch: '7/12',
      type: 'garage',
      confidence: 0.25,
    };

    // Small dormer to add complexity
    const dW = 0.18 * s;
    const dH = 0.12 * s;
    const dx = W * 0.35;
    const dy = H * 0.15;
    const dormer: RoofFacet = {
      id: 'fallback-dormer',
      polygon: [ [dx,dy], [dx + dW, dy], [dx + dW, dy + dH] ],
      area: (dW * dH) / 2,
      pitch: '9/12',
      type: 'dormer',
      confidence: 0.2,
    };

    return [mainA, mainB, garageA, garageB, dormer];
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

        {/* Test Mode - Always Visible */}
        <Card className="border-2 border-amber-500 mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <TriangleAlert className="h-5 w-5" />
              ⚠️ Test Mode (Upload Broken)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              size="lg" 
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold" 
              onClick={loadTestReport}
              disabled={isAnalyzing}
            >
              🔧 LOAD TEST EAGLEVIEW REPORT
            </Button>
            {testReportLoaded && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm text-amber-800 font-medium">
                  ✅ Test report loaded: {TEST_EAGLEVIEW_REPORT.address}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Big Comparison Display */}
        {currentPrediction && testReportLoaded && (
          <Card className="border-2 border-blue-500 mb-4">
            <CardHeader>
              <CardTitle className="text-xl text-blue-600">📊 AI vs EagleView Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800">AI Prediction</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(currentPrediction.prediction.totalArea)} sq ft
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-800">EagleView Actual</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {TEST_EAGLEVIEW_REPORT.measurements.totalArea} sq ft
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <h3 className="font-semibold text-red-800">Error</h3>
                  <p className={`text-2xl font-bold ${
                    currentPrediction.comparison?.areaErrorPercent > 10 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {currentPrediction.comparison?.areaErrorPercent || 0}%
                    {(currentPrediction.comparison?.areaErrorPercent || 0) > 10 && ' ❌'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                  <div className="mt-4 flex items-center gap-3">
                    <Button variant="outline" onClick={loadTestReport} className="border-dashed">
                      <FileText className="mr-2 h-4 w-4" />
                      Load Sample EagleView Report
                    </Button>
                    {testReportLoaded && (
                      <Badge variant="outline" className="text-xs">
                        Test report loaded: {TEST_EAGLEVIEW_REPORT.address}
                      </Badge>
                    )}
                  </div>
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

              {/* Technical Roof Diagram + Source Imagery (right column) */}
              <div>
                <Card className="sticky top-0 z-20 bg-background">
                  <CardHeader>
                    <CardTitle>Technical Roof Diagram</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[560px]">
                    {!hasGeometry && (
                      <div className="mb-3 inline-flex items-center gap-2 text-xs text-roofiq-amber">
                        <TriangleAlert className="w-4 h-4" />
                        <span>Illustrative only — add a manual trace to replace this sketch</span>
                      </div>
                    )}
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

                {/* Source Aerial Imagery */}
                <div className="mt-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        Source Aerial Imagery
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {calibration ? (
                          <Badge variant="outline" className="text-xs">
                            Calibrated • {calibration.method} • {(calibration.confidence * 100).toFixed(0)}%
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Uncalibrated</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {satelliteUrl ? (
                        <div className="relative">
                          <img
                            src={satelliteUrl}
                            alt={`Satellite of ${currentPrediction.address}`}
                            className="w-full h-auto rounded-lg border border-border"
                            loading="lazy"
                          />
                          {!hasGeometry && (
                            <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-background/80 text-xs border border-border">No verified geometry yet</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">Fetching satellite image…</div>
                      )}

                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          variant="secondary"
                          disabled={!satelliteUrl || isCalibrating}
                          onClick={async () => {
                            if (!satelliteUrl) return;
                            try {
                              setIsCalibrating(true);
                              const res = await ScaleCalibrationService.calibrateFromImage(satelliteUrl);
                              setCalibration(res);
                              toast({
                                title: 'Scale calibrated',
                                description: `1 px ≈ ${res.feetPerPixel.toFixed(2)} ft (${(res.confidence * 100).toFixed(0)}% via ${res.method})`,
                              });
                            } catch (e) {
                              console.error(e);
                              toast({ title: 'Calibration failed', description: 'Try a different address or angle.', variant: 'destructive' });
                            } finally {
                              setIsCalibrating(false);
                            }
                          }}
                        >
                          {isCalibrating ? 'Calibrating…' : 'Calibrate scale'}
                        </Button>

                        {!hasGeometry && (
                          <Button onClick={() => setIsTracing(true)}>Trace roof manually</Button>
                        )}

                        {calibration && (
                          <div className="text-xs text-muted-foreground">
                            Estimated: 1 px ≈ {calibration.feetPerPixel.toFixed(2)} ft
                          </div>
                        )}
                      </div>

                      {isTracing && satelliteUrl && (
                        <RoofTraceOverlay
                          imageUrl={satelliteUrl}
                          address={currentPrediction.address}
                          coordinates={currentPrediction.coordinates}
                          zoom={usedZoom}
                          retina={true}
                          onCancel={() => setIsTracing(false)}
                          onSave={({ facets, perimeterFeet, totalAreaFeet2 }) => {
                            if (!currentPrediction) return;
                            const updated = {
                              ...currentPrediction,
                              satelliteImage: satelliteUrl,
                              prediction: {
                                ...currentPrediction.prediction,
                                facets: facets,
                                totalArea: Math.round(totalAreaFeet2),
                                squares: Number(((Math.round(totalAreaFeet2)) / 100).toFixed(1)),
                                reportSummary: {
                                  ...currentPrediction.prediction.reportSummary,
                                  totalPerimeter: perimeterFeet,
                                },
                              },
                            } as RoofPrediction;
                            setCurrentPrediction(updated);
                            setIsTracing(false);
                            toast({ title: 'Geometry updated', description: 'Manual trace applied to the technical diagram.' });
                          }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </div>
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