import { pipeline, env } from '@huggingface/transformers';

// Lightweight, heuristic scale calibration using image segmentation
// Detects roads and cars to estimate feet-per-pixel
export type CalibrationResult = {
  feetPerPixel: number;
  method: 'road' | 'car' | 'combined';
  confidence: number; // 0..1
};

export class ScaleCalibrationService {
  private static segmenterPromise: Promise<any> | null = null;

  private static getSegmenter() {
    if (!this.segmenterPromise) {
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      this.segmenterPromise = pipeline(
        'image-segmentation',
        'Xenova/segformer-b0-finetuned-ade-512-512',
        {
          device: 'webgpu',
        }
      );
    }
    return this.segmenterPromise;
  }

  static async calibrateFromImage(imageUrl: string): Promise<CalibrationResult> {
    // Load image
    const img = await this.loadImage(imageUrl);

    // Draw to canvas (cap size for performance)
    const { canvas, ctx } = this.drawScaled(img, 1024);

    const segmenter = await this.getSegmenter();
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const results: Array<{ label: string; score: number; mask: { data: Float32Array; width: number; height: number } }>
      = await segmenter(dataUrl);

    // Extract references
    const roadPx = this.estimateRoadWidthPx(results);
    const carPx = this.estimateCarLengthPx(results);

    const refs: Array<{ ftPerPx: number; conf: number; method: CalibrationResult['method'] }> = [];

    if (roadPx && roadPx.px > 6) {
      const standardRoadFeet = 26; // residential typical
      refs.push({ ftPerPx: standardRoadFeet / roadPx.px, conf: roadPx.conf, method: 'road' });
    }

    if (carPx && carPx.px > 4) {
      const standardCarFeet = 15; // sedan length
      refs.push({ ftPerPx: standardCarFeet / carPx.px, conf: carPx.conf, method: 'car' });
    }

    if (refs.length === 0) {
      // fallback conservative guess using Web Mercator scale at z≈20 near mid-latitudes (~0.09 ft/px for 1024 tile)
      return { feetPerPixel: 0.09, method: 'road', confidence: 0.2 };
    }

    if (refs.length === 1) {
      const r = refs[0];
      return { feetPerPixel: r.ftPerPx, method: r.method, confidence: r.conf };
    }

    // Weighted average by confidence
    const sumW = refs.reduce((s, r) => s + r.conf, 0);
    const ftPerPx = refs.reduce((s, r) => s + r.ftPerPx * r.conf, 0) / (sumW || 1);
    const conf = Math.min(1, sumW / refs.length);
    return { feetPerPixel: ftPerPx, method: 'combined', confidence: conf };
  }

  // Heuristic: pick central-most road segment and use its minor axis (min of bbox w/h) as width
  private static estimateRoadWidthPx(results: any) {
    const roadLabels = new Set(['road', 'highway', 'runway', 'path']);
    const roadSegs = results.filter((r: any) => roadLabels.has((r.label || '').toLowerCase()));
    if (!roadSegs.length) return null;

    let best: { px: number; conf: number } | null = null;
    for (const r of roadSegs) {
      const m = r.mask;
      const bbox = this.maskBBox(m);
      if (!bbox) continue;
      const w = bbox.w;
      const h = bbox.h;
      const px = Math.min(w, h);
      const conf = Math.max(0.6, Math.min(0.95, r.score || 0.8));
      if (!best || px > best.px) best = { px, conf };
    }
    return best;
  }

  // Heuristic: use the larger bbox dimension as car length
  private static estimateCarLengthPx(results: any) {
    const carLabels = new Set(['car', 'bus', 'truck', 'van']);
    const carSegs = results.filter((r: any) => carLabels.has((r.label || '').toLowerCase()));
    if (!carSegs.length) return null;
    // average across top-N
    const dims: number[] = [];
    for (const r of carSegs) {
      const m = r.mask;
      const bbox = this.maskBBox(m);
      if (!bbox) continue;
      const px = Math.max(bbox.w, bbox.h);
      dims.push(px);
    }
    const pxAvg = dims.sort((a, b) => a - b).slice(0, Math.min(5, dims.length)).reduce((s, v) => s + v, 0) / Math.min(5, dims.length);
    const conf = Math.max(0.5, Math.min(0.9, dims.length / 5));
    return { px: pxAvg, conf };
  }

  private static maskBBox(mask: { data: Float32Array; width: number; height: number }) {
    const { data, width, height } = mask;
    let minX = width, minY = height, maxX = -1, maxY = -1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const v = data[y * width + x];
        if (v > 0.5) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < minX || maxY < minY) return null;
    return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  }

  private static drawScaled(image: HTMLImageElement, maxDim: number) {
    let { naturalWidth: w, naturalHeight: h } = image as any;
    const scale = Math.min(1, maxDim / Math.max(w, h));
    w = Math.round(w * scale);
    h = Math.round(h * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0, w, h);
    return { canvas, ctx };
  }

  private static loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }
}
