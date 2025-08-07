import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Home, Calculator, Layers, Building, Target, FileText } from 'lucide-react';
import { RoofPrediction } from '@/types/roof-analysis';

interface ProfessionalReportViewProps {
  prediction: RoofPrediction;
  isEagleView?: boolean;
  title?: string;
}

export const ProfessionalReportView: React.FC<ProfessionalReportViewProps> = ({ 
  prediction, 
  isEagleView = false,
  title 
}) => {
  const data = isEagleView ? prediction.eagleViewData : prediction.prediction;
  if (!data) return null;

  const reportTitle = title || (isEagleView ? 'EagleView Professional Report' : 'RoofIQ AI Analysis Report');
  const reportId = isEagleView && 'reportId' in data ? data.reportId : `RIQ-${prediction.id.slice(0, 8)}`;

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card className="roofiq-card">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-roofiq-blue/10">
                <FileText className="w-6 h-6 text-roofiq-blue" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{reportTitle}</h2>
                <p className="text-sm text-muted-foreground">Report ID: {reportId}</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-roofiq-green/10 text-roofiq-green border-roofiq-green/20">
              Professional Grade
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Property:</span>
              <p className="font-medium text-foreground mt-1">{prediction.address}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Report Date:</span>
              <p className="font-medium text-foreground mt-1">
                {prediction.predictionDate.toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Structure Type:</span>
              <p className="font-medium text-foreground mt-1">Residential</p>
            </div>
            <div>
              <span className="text-muted-foreground">Stories:</span>
              <p className="font-medium text-foreground mt-1">{data.propertyDetails.stories}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="roofiq-card">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-5 h-5 text-roofiq-blue" />
              <span className="text-sm font-medium text-muted-foreground">Total Roof Area</span>
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">
              {data.totalArea.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">square feet</div>
          </div>
        </Card>

        <Card className="roofiq-card">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-5 h-5 text-roofiq-green" />
              <span className="text-sm font-medium text-muted-foreground">Total Squares</span>
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">
              {data.squares.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">@ 100 sq ft each</div>
          </div>
        </Card>

        <Card className="roofiq-card">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-roofiq-amber" />
              <span className="text-sm font-medium text-muted-foreground">Waste Factor</span>
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">
              {data.wasteFactor.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">recommended</div>
          </div>
        </Card>
      </div>

      {/* Areas by Pitch */}
      <Card className="roofiq-card">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Areas by Pitch</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pitch</TableHead>
                <TableHead className="text-right">Area (sq ft)</TableHead>
                <TableHead className="text-right">Squares</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data.areasByPitch && Array.isArray(data.areasByPitch) ? data.areasByPitch : []).map((pitchArea, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{pitchArea.pitch || 'N/A'}</TableCell>
                  <TableCell className="text-right font-mono">
                    {(pitchArea.area || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {(pitchArea.squares || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="font-mono">
                      {pitchArea.percentage || 0}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {(!data.areasByPitch || !Array.isArray(data.areasByPitch) || data.areasByPitch.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No areas by pitch data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Linear Measurements */}
      <Card className="roofiq-card">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Linear Measurements</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.measurements && typeof data.measurements === 'object' ? 
              Object.entries(data.measurements).map(([key, value]) => (
                <div key={key} className="p-3 rounded-lg bg-secondary border border-border">
                  <div className="text-sm text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-lg font-bold text-foreground font-mono">
                    {value || 0} ft
                  </div>
                </div>
              )) : (
                <div className="col-span-full text-center text-muted-foreground py-8">
                  No measurements data available
                </div>
              )
            }
          </div>
        </div>
      </Card>

      {/* Property Details */}
      <Card className="roofiq-card">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Property Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <span className="text-sm text-muted-foreground">Number of Stories</span>
              <p className="text-lg font-semibold text-foreground">{data.propertyDetails.stories}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Estimated Attic Area</span>
              <p className="text-lg font-semibold text-foreground font-mono">
                {data.propertyDetails.estimatedAtticArea.toLocaleString()} sq ft
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Structure Complexity</span>
              <Badge variant="outline" className={`mt-1 ${
                data.propertyDetails.structureComplexity === 'Simple' ? 'bg-roofiq-green/10 text-roofiq-green border-roofiq-green/20' :
                data.propertyDetails.structureComplexity === 'Complex' ? 'bg-roofiq-red/10 text-roofiq-red border-roofiq-red/20' :
                'bg-roofiq-amber/10 text-roofiq-amber border-roofiq-amber/20'
              }`}>
                {data.propertyDetails.structureComplexity}
              </Badge>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Roof Accessibility</span>
              <p className="text-lg font-semibold text-foreground">{data.propertyDetails.roofAccessibility}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Chimneys</span>
              <p className="text-lg font-semibold text-foreground">{data.propertyDetails.chimneys}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Skylights</span>
              <p className="text-lg font-semibold text-foreground">{data.propertyDetails.skylights}</p>
            </div>
          </div>

          <Separator className="my-6" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <span className="text-sm text-muted-foreground">Total Perimeter</span>
              <p className="text-lg font-semibold text-foreground font-mono">
                {data.reportSummary.totalPerimeter} ft
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Average Pitch</span>
              <p className="text-lg font-semibold text-foreground">{data.reportSummary.averagePitch}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Complexity Score</span>
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-foreground">{data.reportSummary.roofComplexityScore}</p>
                <Badge variant="outline" className={`${
                  data.reportSummary.roofComplexityScore >= 80 ? 'bg-roofiq-green/10 text-roofiq-green border-roofiq-green/20' :
                  data.reportSummary.roofComplexityScore >= 60 ? 'bg-roofiq-amber/10 text-roofiq-amber border-roofiq-amber/20' :
                  'bg-roofiq-red/10 text-roofiq-red border-roofiq-red/20'
                }`}>
                  {data.reportSummary.roofComplexityScore >= 80 ? 'Excellent' :
                   data.reportSummary.roofComplexityScore >= 60 ? 'Good' : 'Fair'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Facet Details */}
      <Card className="roofiq-card">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Roof Facets Analysis</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Facet</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Pitch</TableHead>
                <TableHead className="text-right">Area (sq ft)</TableHead>
                {!isEagleView && <TableHead className="text-right">Confidence</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data.facets && Array.isArray(data.facets) ? data.facets : []).map((facet, index) => (
                <TableRow key={facet.id || `facet-${index}`}>
                  <TableCell className="font-medium">#{index + 1}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {facet.type || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{facet.pitch || 'N/A'}</TableCell>
                  <TableCell className="text-right font-mono">
                    {(facet.area || 0).toLocaleString()}
                  </TableCell>
                  {!isEagleView && (
                    <TableCell className="text-right">
                      <Badge variant="outline" className={`${
                        (facet.confidence || 0) >= 85 ? 'bg-roofiq-green/10 text-roofiq-green border-roofiq-green/20' :
                        (facet.confidence || 0) >= 70 ? 'bg-roofiq-amber/10 text-roofiq-amber border-roofiq-amber/20' :
                        'bg-roofiq-red/10 text-roofiq-red border-roofiq-red/20'
                      }`}>
                        {(facet.confidence || 0).toFixed(1)}%
                      </Badge>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {(!data.facets || !Array.isArray(data.facets) || data.facets.length === 0) && (
                <TableRow>
                  <TableCell colSpan={isEagleView ? 4 : 5} className="text-center text-muted-foreground py-8">
                    No roof facets data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};