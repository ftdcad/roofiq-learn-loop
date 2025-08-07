import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface RoofTraceOverlayProps {
  imageUrl: string;
  address: string;
  coordinates: { lat: number; lng: number };
  zoom: number; // Map zoom used to fetch the static image
  retina?: boolean; // whether @2x was used
  onCancel?: () => void;
  onSave?: (args: {
    facets: { id: string; polygon: [number, number][]; area: number; pitch: string; type: 'main'; confidence: number }[];
    perimeterFeet: number;
    totalAreaFeet2: number;
  }) => void;
}

// Compute meters per pixel for Web Mercator at a given latitude/zoom
function metersPerPixel(latDeg: number, zoom: number, retina: boolean) {
  const latRad = (latDeg * Math.PI) / 180;
  const base = 156543.03392 * Math.cos(latRad) / Math.pow(2, zoom);
  // Retina @2x packs more pixels into same ground area
  return retina ? base / 2 : base;
}

function polygonPerimeterPx(points: [number, number][]) {
  if (points.length < 2) return 0;
  let peri = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    const dx = x2 - x1;
    const dy = y2 - y1;
    peri += Math.hypot(dx, dy);
  }
  return peri;
}

function polygonAreaPx2(points: [number, number][]) {
  // Shoelace formula; returns absolute area in px^2
  if (points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

export const RoofTraceOverlay: React.FC<RoofTraceOverlayProps> = ({
  imageUrl,
  address,
  coordinates,
  zoom,
  retina = true,
  onCancel,
  onSave,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [points, setPoints] = useState<[number, number][]>([]);
  const [isClosed, setIsClosed] = useState(false);
  const { toast } = useToast();

  // Derived scale
  const mPerPx = useMemo(() => metersPerPixel(coordinates.lat, zoom, retina), [coordinates.lat, zoom, retina]);
  const ftPerPx = mPerPx * 3.28084;

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isClosed) return;

    // If clicking near the first point and we have at least 3 points, close the polygon
    const closeThreshold = 8; // px
    if (points.length >= 3) {
      const [fx, fy] = points[0];
      if (Math.hypot(x - fx, y - fy) <= closeThreshold) {
        setIsClosed(true);
        return;
      }
    }

    setPoints((prev) => [...prev, [x, y]]);
  }, [isClosed, points]);

  const handleReset = useCallback(() => {
    setPoints([]);
    setIsClosed(false);
  }, []);

  const handleSave = useCallback(() => {
    if (!points.length || !isClosed || !onSave) {
      toast({ title: 'Incomplete sketch', description: 'Finish tracing the outline before saving.', variant: 'destructive' });
      return;
    }

    const periPx = polygonPerimeterPx(points);
    const areaPx2 = polygonAreaPx2(points);

    const perimeterFeet = periPx * ftPerPx;
    const areaFeet2 = areaPx2 * (ftPerPx * ftPerPx);

    const facets = [
      {
        id: 'manual-trace-1',
        polygon: points,
        area: areaFeet2,
        pitch: 'unknown',
        type: 'main' as const,
        confidence: 0.9,
      },
    ];

    onSave({ facets, perimeterFeet, totalAreaFeet2: areaFeet2 });

    toast({ title: 'Trace saved', description: 'Manual roof outline saved and applied to diagram.' });
  }, [points, isClosed, ftPerPx, onSave, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel?.();
      if (e.key.toLowerCase() === 'r') handleReset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleReset, onCancel]);

  return (
    <Card className="p-3">
      <div className="mb-2 text-xs text-muted-foreground">
        Tracing on satellite image for {address}. Click to add points; click near the first point to close. Press R to reset.
      </div>
      <div ref={containerRef} className="relative w-full overflow-hidden rounded-lg border border-border">
        <img ref={imgRef} src={imageUrl} alt={`Satellite of ${address}`} className="w-full h-auto select-none pointer-events-none" />
        {/* SVG overlay */}
        <svg
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onClick={handleClick}
        >
          {/* Draw lines */}
          {points.length > 0 && (
            <polyline
              points={points.map(([x, y]) => `${x},${y}`).join(' ')}
              fill={isClosed ? 'hsl(var(--roofiq-blue) / 0.15)' : 'none'}
              stroke="hsl(var(--roofiq-blue))"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {/* Guideline from last point to cursor could be added here if needed */}
          {/* Draw points */}
          {points.map(([x, y], idx) => (
            <circle key={idx} cx={x} cy={y} r={4} fill="hsl(var(--foreground))" stroke="hsl(var(--background))" strokeWidth={1} />
          ))}
        </svg>
      </div>

      {/* Measurements preview */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <div>
          Points: <span className="text-foreground font-medium">{points.length}</span>
        </div>
        <div>
          Perimeter: <span className="text-foreground font-medium">{(polygonPerimeterPx(points) * ftPerPx).toFixed(1)} ft</span>
        </div>
        <div>
          Area: <span className="text-foreground font-medium">{(polygonAreaPx2(points) * (ftPerPx * ftPerPx)).toFixed(0)} ft²</span>
        </div>
        <div className="ml-auto text-xs">Scale: ~{ftPerPx.toFixed(2)} ft/px @ zoom {zoom}{retina ? ' (retina)' : ''}</div>
      </div>

      <div className="mt-3 flex gap-2">
        <Button variant="secondary" onClick={handleReset}>Reset</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button className="ml-auto" onClick={handleSave} disabled={!isClosed}>Save Trace</Button>
      </div>
      <div className="mt-2 text-xs text-roofiq-amber">
        Note: Measurements are approximate. Use professional tools for final verification.
      </div>
    </Card>
  );
};
