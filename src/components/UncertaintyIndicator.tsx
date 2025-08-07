import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RoofPrediction } from '@/types/roof-analysis';

interface UncertaintyIndicatorProps {
  prediction: RoofPrediction;
}

export const UncertaintyIndicator: React.FC<UncertaintyIndicatorProps> = ({ prediction }) => {
  const confidence = prediction.prediction.confidence;
  const dualModelData = prediction.prediction.dualModelMetadata;
  const needsVerification = dualModelData?.uncertaintyAnalysis?.needsVerification || confidence < 70;

  if (!needsVerification && confidence >= 85) {
    return (
      <Alert className="border-roofiq-green/20 bg-roofiq-green/10">
        <CheckCircle className="h-4 w-4 text-roofiq-green" />
        <AlertDescription className="text-roofiq-green">
          High confidence prediction - ready to use
        </AlertDescription>
      </Alert>
    );
  }

  if (confidence >= 70) {
    return (
      <Alert className="border-roofiq-amber/20 bg-roofiq-amber/10">
        <AlertCircle className="h-4 w-4 text-roofiq-amber" />
        <AlertDescription className="text-roofiq-amber">
          Moderate confidence - consider EagleView verification
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-roofiq-red/20 bg-roofiq-red/10">
      <AlertTriangle className="h-4 w-4 text-roofiq-red" />
      <AlertDescription className="text-roofiq-red">
        <div className="space-y-2">
          <div className="font-medium">Low confidence - EagleView required</div>
          <div className="text-sm">
            {dualModelData?.reasoning || 'Image quality or complexity requires verification'}
          </div>
          <Badge variant="outline" className="bg-roofiq-red/5 text-roofiq-red border-roofiq-red/20">
            REQUIRE_EAGLEVIEW
          </Badge>
        </div>
      </AlertDescription>
    </Alert>
  );
};