import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { MapPin, Flag, CheckCircle } from 'lucide-react';

interface NeighborhoodData {
  averageRoofArea: number;
  medianRoofArea: number;
  totalSamples: number;
}

interface NeighborhoodContextProps {
  prediction: number;
  neighborhoodData?: NeighborhoodData;
  address: string;
}

export const NeighborhoodContext: React.FC<NeighborhoodContextProps> = ({
  prediction,
  neighborhoodData,
  address
}) => {
  if (!neighborhoodData || neighborhoodData.totalSamples < 3) {
    return (
      <Alert className="border-muted bg-muted/50">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <AlertDescription className="text-muted-foreground">
          Insufficient neighborhood data (need 3+ nearby roofs)
        </AlertDescription>
      </Alert>
    );
  }

  const { averageRoofArea, medianRoofArea, totalSamples } = neighborhoodData;
  const deviation = Math.abs(prediction - averageRoofArea) / averageRoofArea;
  const isOutlier = deviation > 0.3; // 30% deviation threshold

  if (isOutlier) {
    return (
      <Alert className="border-roofiq-red/20 bg-roofiq-red/10">
        <Flag className="h-4 w-4 text-roofiq-red" />
        <AlertDescription className="text-roofiq-red">
          <div className="space-y-2">
            <div className="font-medium">🚩 Unusual for neighborhood</div>
            <div className="text-sm space-y-1">
              <div>Prediction: {Number(prediction ?? 0).toLocaleString()} sq ft</div>
              <div>Neighborhood avg: {Number(averageRoofArea ?? 0).toLocaleString()} sq ft</div>
              <div>Based on {totalSamples} nearby roofs</div>
            </div>
            <Badge variant="outline" className="bg-roofiq-red/5 text-roofiq-red border-roofiq-red/20">
              REQUIRES_REVIEW
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-roofiq-green/20 bg-roofiq-green/10">
      <CheckCircle className="h-4 w-4 text-roofiq-green" />
      <AlertDescription className="text-roofiq-green">
        <div className="space-y-1">
          <div className="font-medium">✓ Consistent with neighborhood</div>
          <div className="text-sm">
            Avg: {Number(averageRoofArea ?? 0).toLocaleString()} sq ft ({totalSamples} nearby roofs)
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};