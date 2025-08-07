import React from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { MapPin, Info } from 'lucide-react';

interface SatelliteImageCaptureProps {
  address: string;
  coordinates: { lat: number; lng: number };
  onImageCaptured?: (imageUrl: string) => void;
}

export const SatelliteImageCapture: React.FC<SatelliteImageCaptureProps> = ({
  address,
  coordinates,
  onImageCaptured
}) => {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-roofiq-blue" />
          <span className="text-sm font-medium text-foreground">Satellite Image Capture</span>
          <Badge variant="outline" className="text-xs">
            High-Resolution
          </Badge>
        </div>

        <Alert className="border-roofiq-blue/20 bg-roofiq-blue/5">
          <Info className="w-4 h-4 text-roofiq-blue" />
          <AlertDescription className="text-roofiq-blue text-sm">
            <div className="space-y-1">
              <div className="font-medium">Ready for high-resolution capture</div>
              <div>• Zoom level 20 for maximum detail</div>
              <div>• 1024x1024 retina quality</div>
              <div>• Multiple angle capture available</div>
            </div>
          </AlertDescription>
        </Alert>

        <div className="text-xs text-muted-foreground space-y-1">
          <div>Address: {address}</div>
          <div>Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}</div>
          <div>Requires Mapbox API key configuration</div>
        </div>
      </div>
    </Card>
  );
};