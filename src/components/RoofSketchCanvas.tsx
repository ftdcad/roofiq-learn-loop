import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Line, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';

// Facet shape used by the editable canvas
export type SketchFacet = { points: number[] };

interface SketchProps {
  imageUrl: string;
  initialFacets: SketchFacet[];
  onFacetsChange?: (facets: SketchFacet[]) => void;
}

function flattenToPairs(points: number[]): [number, number][] {
  const pairs: [number, number][] = [];
  for (let i = 0; i < points.length; i += 2) {
    pairs.push([points[i], points[i + 1]]);
  }
  return pairs;
}

function pairsToFlat(pairs: [number, number][]): number[] {
  const out: number[] = [];
  for (const [x, y] of pairs) out.push(x, y);
  return out;
}

function getBounds(points: number[]): { minX: number; minY: number; maxX: number; maxY: number } {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < points.length; i += 2) {
    xs.push(points[i]);
    ys.push(points[i + 1]);
  }
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

export const RoofSketchCanvas: React.FC<SketchProps> = ({ imageUrl, initialFacets, onFacetsChange }) => {
  const [konvaImage] = useImage(imageUrl);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({ width: 1024, height: 1024 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Internal editable facets in image-pixel space
  const [facets, setFacets] = useState<SketchFacet[]>([]);

  // Drawing state for a new polygon
  const [isDrawing, setIsDrawing] = useState(false);
  const [newPoints, setNewPoints] = useState<number[]>([]);

  // When image loads, set canvas size to its natural size
  useEffect(() => {
    if (konvaImage && konvaImage.width && konvaImage.height) {
      setCanvasSize({ width: konvaImage.width, height: konvaImage.height });
    }
  }, [konvaImage]);

  // Fit provided facets into the image coordinate system initially
  useEffect(() => {
    if (!initialFacets?.length || !canvasSize.width || !canvasSize.height) return;

    // Compute bounds across all facets
    const allPoints = initialFacets.flatMap((f) => f.points);
    if (!allPoints.length) return;
    const { minX, minY, maxX, maxY } = getBounds(allPoints);
    const srcW = Math.max(1, maxX - minX);
    const srcH = Math.max(1, maxY - minY);

    const pad = 16; // px padding inside the image
    const dstW = Math.max(1, canvasSize.width - pad * 2);
    const dstH = Math.max(1, canvasSize.height - pad * 2);

    const scale = Math.min(dstW / srcW, dstH / srcH);

    const scaled = initialFacets.map((f) => {
      const pairs = flattenToPairs(f.points).map(([x, y]) => [
        pad + (x - minX) * scale,
        pad + (y - minY) * scale,
      ] as [number, number]);
      return { points: pairsToFlat(pairs) } as SketchFacet;
    });

    setFacets(scaled);
  }, [initialFacets, canvasSize.width, canvasSize.height]);

  // Notify parent on changes
  useEffect(() => {
    if (facets && onFacetsChange) onFacetsChange(facets);
  }, [facets, onFacetsChange]);

  const handleStageMouseDown = (e: any) => {
    if (!isDrawing) {
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      if (!pos) return;
      setNewPoints([pos.x, pos.y]);
      setIsDrawing(true);
    } else {
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      if (!pos) return;
      setNewPoints((pts) => [...pts, pos.x, pos.y]);
    }
  };

  const handleStageDblClick = () => {
    if (newPoints.length > 4) {
      setFacets((prev) => [...prev, { points: newPoints }]);
    }
    setIsDrawing(false);
    setNewPoints([]);
  };

  const updateFacetAt = (idx: number, newFacet: SketchFacet) => {
    setFacets((prev) => prev.map((f, i) => (i === idx ? newFacet : f)));
  };

  return (
    <div ref={containerRef} className="w-full overflow-auto rounded-lg border border-border">
      <Stage
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseDown={handleStageMouseDown}
        onDblClick={handleStageDblClick}
        style={{ background: 'transparent' }}
      >
        <Layer>
          {konvaImage && (
            <KonvaImage image={konvaImage} width={canvasSize.width} height={canvasSize.height} />
          )}

          {/* Existing facets - draggable polygons */}
          {facets.map((facet, idx) => (
            <Line
              key={idx}
              points={facet.points}
              closed
              stroke={'#22c55e'} // semantic: green-500
              strokeWidth={2}
              draggable
              onDragEnd={(e) => {
                const dx = e.target.x();
                const dy = e.target.y();
                const movedPairs = flattenToPairs(facet.points).map(([x, y]) => [x + dx, y + dy] as [number, number]);
                e.target.x(0);
                e.target.y(0);
                updateFacetAt(idx, { points: pairsToFlat(movedPairs) });
              }}
            />
          ))}

          {/* New polygon being drawn */}
          {isDrawing && newPoints.length > 2 && (
            <Line
              points={newPoints}
              stroke={'#ef4444'} // semantic: red-500
              strokeWidth={2}
              lineCap="round"
              lineJoin="round"
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default RoofSketchCanvas;
