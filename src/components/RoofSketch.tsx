import React, { useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import type { RoofFacet } from '@/types/roof-analysis';

interface RoofSketchProps {
  facets: RoofFacet[];
  width?: number;
  height?: number;
  showLabels?: boolean;
  showMeasurements?: boolean;
  perimeterFeet?: number; // total outer perimeter in feet to calibrate edge labels
}

// Helper types
interface Point { x: number; y: number }
interface Edge {
  start: Point;
  end: Point;
  // classification
  kind: 'outer' | 'ridge' | 'valley' | 'shared';
  // raw length in input units
  rawLength: number;
  // calibrated feet (if perimeterFeet provided)
  feet?: number;
}

export function RoofSketch({
  facets,
  width = 520,
  height = 520,
  showLabels = true,
  showMeasurements = true,
  perimeterFeet,
}: RoofSketchProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const { transformedFacets, edges, scaleBarFeet, pxPerFoot, boundsPad } = useMemo(() => {
    const pts = facets.flatMap(f => f.polygon.map(([x, y]) => ({ x, y })));
    const minX = Math.min(...pts.map(p => p.x));
    const maxX = Math.max(...pts.map(p => p.x));
    const minY = Math.min(...pts.map(p => p.y));
    const maxY = Math.max(...pts.map(p => p.y));

    const pad = 40; // margin padding
    const spanX = Math.max(1e-6, maxX - minX);
    const spanY = Math.max(1e-6, maxY - minY);
    const scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY);

    const toCanvas = (p: Point): Point => ({
      x: pad + (p.x - minX) * scale,
      y: pad + (p.y - minY) * scale,
    });

    // Transform facets
    const tfFacets = facets.map(f => ({
      ...f,
      polygon: f.polygon.map(([x, y]) => toCanvas({ x, y })) as any,
    }));

    // Build edges and classify
    const allEdges: Edge[] = buildEdges(facets).map(e => ({
      start: toCanvas(e.start),
      end: toCanvas(e.end),
      kind: e.kind,
      rawLength: distance(e.start, e.end),
    }));

    // Calibrate feet by matching outer perimeter if provided
    const totalOuterRaw = allEdges
      .filter(e => e.kind === 'outer')
      .reduce((s, e) => s + e.rawLength, 0);

    const feetPerPx = perimeterFeet && totalOuterRaw > 0 ? perimeterFeet / totalOuterRaw : undefined;
    const calibratedEdges = allEdges.map(e => ({
      ...e,
      feet: feetPerPx ? roundTo(distance(e.start, e.end) * feetPerPx, 1) : undefined,
    }));

    // Choose a nice scale-bar length (in feet) based on available px/ft
    let scaleBarFeet = 20;
    if (feetPerPx) {
      const desiredPx = 80; // aim for ~80px bar
      const ft = desiredPx * feetPerPx;
      // round to a nice number: 5, 10, 20, 50, 100
      const nice = [5, 10, 20, 50, 100];
      scaleBarFeet = nice.reduce((best, n) => (Math.abs(n - ft) < Math.abs(best - ft) ? n : best), nice[0]);
    }

    return {
      transformedFacets: tfFacets,
      edges: calibratedEdges,
      scaleBarFeet,
      pxPerFoot: feetPerPx ? 1 / feetPerPx : undefined,
      boundsPad: pad,
    };
  }, [facets, width, height, perimeterFeet]);

  const downloadSVG = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'roof-diagram.svg';
    link.click();
  };

  const downloadPNG = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = 'roof-diagram.png';
        a.click();
      });
    };
    img.src = url;
  };

  // Compute centroid for labels
  const centroid = (points: Point[]) => {
    const x = points.reduce((s, p) => s + p.x, 0) / points.length;
    const y = points.reduce((s, p) => s + p.y, 0) / points.length;
    return { x, y };
  };

  // Edge measurement label position
  const midPoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  return (
    <div className="flex flex-col gap-3">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="bg-background border border-border rounded-md"
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Facet polygons (subtle fill) */}
        {transformedFacets.map((facet) => {
          const pts = (facet.polygon as any as Point[]);
          const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
          const c = centroid(pts);
          return (
            <g key={facet.id}>
              <path d={d} fill="hsl(var(--muted))" fillOpacity="0.15" stroke="none" />
              {showLabels && (
                <g>
                  <text x={c.x} y={c.y} textAnchor="middle" className="fill-muted-foreground" fontSize={12}>
                    {facet.pitch}
                  </text>
                  <text x={c.x} y={c.y + 14} textAnchor="middle" className="fill-muted-foreground" fontSize={11}>
                    {Math.round(facet.area)} sq ft
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Edges */}
        {edges.map((e, i) => {
          const cls =
            e.kind === 'outer' ? 'text-foreground' :
            e.kind === 'ridge' ? 'text-destructive' :
            e.kind === 'valley' ? 'text-primary' : 'text-muted-foreground';
          return (
            <line
              key={i}
              x1={e.start.x}
              y1={e.start.y}
              x2={e.end.x}
              y2={e.end.y}
              stroke="currentColor"
              className={cls}
              strokeWidth={e.kind === 'outer' ? 2 : 1.5}
            />
          );
        })}

        {/* Measurements */}
        {showMeasurements && edges.map((e, i) => {
          const mid = midPoint(e.start, e.end);
          const label = typeof e.feet === 'number' ? `${e.feet.toFixed(0)}'` : `${roundTo(e.rawLength, 1)}`;
          return (
            <text key={`m-${i}`} x={mid.x} y={mid.y - 4} textAnchor="middle" className="fill-muted-foreground" fontSize={10}>
              {label}
            </text>
          );
        })}

        {/* Scale bar (bottom-right) */}
        {pxPerFoot && (
          <g transform={`translate(${width - 140}, ${height - 24})`}>
            <line x1={0} y1={0} x2={scaleBarFeet * pxPerFoot} y2={0} stroke="currentColor" className="text-foreground" strokeWidth={2} />
            <line x1={0} y1={-6} x2={0} y2={6} stroke="currentColor" className="text-foreground" strokeWidth={2} />
            <line x1={scaleBarFeet * pxPerFoot} y1={-6} x2={scaleBarFeet * pxPerFoot} y2={6} stroke="currentColor" className="text-foreground" strokeWidth={2} />
            <text x={(scaleBarFeet * pxPerFoot) / 2} y={-8} textAnchor="middle" className="fill-muted-foreground" fontSize={11}>
              {scaleBarFeet} ft
            </text>
          </g>
        )}

        {/* North arrow (top-left) */}
        <g transform={`translate(${boundsPad}, ${boundsPad - 4})`}>
          <line x1={0} y1={24} x2={0} y2={0} stroke="currentColor" className="text-foreground" strokeWidth={2} markerEnd="url(#arrowhead)" />
          <text x={0} y={-4} textAnchor="middle" className="fill-foreground" fontSize={12}>N</text>
        </g>

        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" className="fill-foreground" />
          </marker>
        </defs>
      </svg>

      <div className="flex gap-2">
        <Button onClick={downloadSVG} variant="secondary">Download SVG</Button>
        <Button onClick={downloadPNG} variant="default">Download PNG</Button>
      </div>

      <div className="text-xs text-muted-foreground">
        <span className="inline-flex items-center mr-4"><span className="w-4 h-0.5 bg-foreground mr-1.5" /> Outline</span>
        <span className="inline-flex items-center mr-4"><span className="w-4 h-0.5 bg-destructive mr-1.5" /> Ridges</span>
        <span className="inline-flex items-center mr-4"><span className="w-4 h-0.5 bg-primary mr-1.5" /> Valleys</span>
      </div>
    </div>
  );
}

// Build unique edges across facets and classify
function buildEdges(facets: RoofFacet[]): Array<{ start: Point; end: Point; kind: Edge['kind'] }> {
  const map = new Map<string, { start: Point; end: Point; count: number; facets: RoofFacet[] }>();
  const keyFor = (a: Point, b: Point) => {
    const ra = `${roundTo(a.x, 5)},${roundTo(a.y, 5)}`;
    const rb = `${roundTo(b.x, 5)},${roundTo(b.y, 5)}`;
    return ra < rb ? `${ra}|${rb}` : `${rb}|${ra}`;
  };

  for (const f of facets) {
    const pts = f.polygon.map(([x, y]) => ({ x, y }));
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const k = keyFor(a, b);
      const entry = map.get(k);
      if (entry) {
        entry.count += 1;
        entry.facets.push(f);
      } else {
        map.set(k, { start: a, end: b, count: 1, facets: [f] });
      }
    }
  }

  const edges: Array<{ start: Point; end: Point; kind: Edge['kind'] }> = [];
  for (const { start, end, count, facets: fs } of map.values()) {
    let kind: Edge['kind'] = count === 1 ? 'outer' : 'shared';
    if (count > 1 && fs.length >= 2) {
      // Heuristic: if adjacent facets share identical pitch text, mark as ridge; else valley
      const p0 = fs[0]?.pitch ?? '';
      const isRidge = fs.some(f => f.pitch === p0);
      kind = isRidge ? 'ridge' : 'valley';
    }
    edges.push({ start, end, kind });
  }
  return edges;
}

function distance(a: Point, b: Point) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function roundTo(n: number, d = 2) {
  const p = Math.pow(10, d);
  return Math.round(n * p) / p;
}
