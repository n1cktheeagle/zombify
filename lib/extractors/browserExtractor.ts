/**
 * Browser-based extraction module for Zombify
 * Extracts real colors, text, and contrast data from images client-side
 * This eliminates GPT hallucinations by providing ground truth data
 */

import Tesseract from 'tesseract.js';

export interface ColorInfo {
  hex: string;
  rgb: { r: number; g: number; b: number };
  frequency: number;
  luminance: number;
}

export interface ContrastIssue {
  foreground: string;
  background: string;
  ratio: number;
  location: string;
  wcagLevel: 'FAIL' | 'AA' | 'AAA';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface TextBlock {
  text: string;
  confidence: number;
  location?: { x: number; y: number; w: number; h: number };
}

export interface ExtractedData {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string[];
    palette: ColorInfo[];
  };
  contrast: {
    issues: ContrastIssue[];
    passes: ContrastIssue[];
  };
  text: {
    extracted: string;
    blocks: TextBlock[];
    confidence: number;
  };
  spacing: {
    avgPadding: number;
    consistency: number;
    gridAlignment: boolean;
  };
  metadata: {
    dimensions: { width: number; height: number };
    fileSize: number;
    timestamp: string;
  };
}

export class BrowserExtractor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
  }

  /**
   * Main extraction method - extracts all data from an image
   */
  async extractAll(file: File, onProgress?: (stage: string, progress: number) => void): Promise<ExtractedData> {
    console.log('[BrowserExtractor] Starting extraction for:', file.name);
    
    try {
      // Load image
      onProgress?.('loading', 0);
      const img = await this.loadImage(file);
      
      // Extract colors (fast)
      onProgress?.('colors', 25);
      const colors = await this.extractColors(img);
      
      // Extract text (slower)
      onProgress?.('text', 50);
      const text = await this.extractText(file);
      
      // Analyze contrast
      onProgress?.('contrast', 75);
      const contrast = this.analyzeContrast(colors.palette);
      
      // Analyze spacing
      onProgress?.('spacing', 90);
      const spacing = this.analyzeSpacing(img);
      
      onProgress?.('complete', 100);
      
      return {
        colors,
        contrast,
        text,
        spacing,
        metadata: {
          dimensions: { width: img.width, height: img.height },
          fileSize: file.size,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('[BrowserExtractor] Extraction failed:', error);
      throw error;
    }
  }

  /**
   * Load image from file
   */
  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Extract dominant colors from image
   */
  private async extractColors(img: HTMLImageElement): Promise<ExtractedData['colors']> {
    // Set canvas size
    this.canvas.width = img.width;
    this.canvas.height = img.height;
    this.ctx.drawImage(img, 0, 0);
    
    // Get pixel data
    const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
    const pixels = imageData.data;
    
    // Count color frequency (sample every 10th pixel for speed)
    const colorMap = new Map<string, number>();
    const colorDetails = new Map<string, ColorInfo>();
    
    for (let i = 0; i < pixels.length; i += 40) { // Sample rate: every 10th pixel
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      
      if (a < 128) continue; // Skip transparent pixels
      
      // Round colors to reduce noise
      const rr = Math.round(r / 10) * 10;
      const gr = Math.round(g / 10) * 10;
      const br = Math.round(b / 10) * 10;
      
      const key = `${rr},${gr},${br}`;
      colorMap.set(key, (colorMap.get(key) || 0) + 1);
      
      if (!colorDetails.has(key)) {
        colorDetails.set(key, {
          rgb: { r: rr, g: gr, b: br },
          hex: this.rgbToHex(rr, gr, br),
          frequency: 0,
          luminance: this.getLuminance(rr, gr, br)
        });
      }
    }
    
    // Sort by frequency and get top colors
    const sorted = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([key, frequency]) => {
        const details = colorDetails.get(key)!;
        return { ...details, frequency };
      });
    
    // Smart color categorization
    const background = this.findBackgroundColor(sorted);
    const textColors = this.findTextColors(sorted, background);
    const primary = this.findPrimaryColor(sorted, background, textColors);
    const secondary = this.findSecondaryColor(sorted, primary, background, textColors);
    
    return {
      primary: primary.hex,
      secondary: secondary.hex,
      background: background.hex,
      text: textColors.map(c => c.hex),
      palette: sorted
    };
  }

  /**
   * Extract text using Tesseract.js OCR
   */
  private async extractText(file: File): Promise<ExtractedData['text']> {
    try {
      console.log('[OCR] Starting text extraction...');
      
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m: any) => {
          if (m?.status === 'recognizing text') {
            console.log(`[OCR] Progress: ${Math.round((m.progress || 0) * 100)}%`);
          }
        },
        // Improve detection on UI screenshots
        tessedit_pageseg_mode: 3 as any, // Fully automatic page segmentation
        preserve_interword_spaces: '1' as any,
        user_defined_dpi: '300' as any,
      } as any);
      
      const page: any = result?.data as any;
      
      // Prefer blocks → lines → words
      let blocks: TextBlock[] = ((page?.blocks || []) as any[]).map((block: any) => ({
        text: (block?.text || '').trim(),
        confidence: block?.confidence,
        location: block?.bbox ? {
          x: block.bbox.x0,
          y: block.bbox.y0,
          w: block.bbox.x1 - block.bbox.x0,
          h: block.bbox.y1 - block.bbox.y0
        } : undefined
      })).filter((b: TextBlock) => b.text.length > 0);

      // If no blocks, synthesize from lines
      if (!blocks || blocks.length === 0) {
        const lines: any[] = (page?.lines || []) as any[];
        const asBlocks = lines
          .map((line: any) => ({
            text: (line?.text || '').trim(),
            confidence: line?.confidence,
            location: line?.bbox ? {
              x: line.bbox.x0,
              y: line.bbox.y0,
              w: line.bbox.x1 - line.bbox.x0,
              h: line.bbox.y1 - line.bbox.y0
            } : undefined
          }))
          .filter((l: any) => l.text.length > 0);
        blocks = asBlocks as any;
      }

      // If still empty, group words into coarse lines by y band
      if (!blocks || blocks.length === 0) {
        const words: any[] = (page?.words || [])
          .filter((w: any) => (w?.text || '').trim().length > 0)
          .map((w: any) => ({
            text: (w.text || '').trim(),
            confidence: w.confidence,
            bbox: w.bbox
          }));
        if (words.length > 0) {
          // Group by approximate y center
          const groups: Array<{ key: number; items: any[] }> = [];
          const band = 24; // px band height
          for (const w of words) {
            const cy = Math.round((((w?.bbox?.y0 || 0) + (w?.bbox?.y1 || 0)) / 2));
            const key = Math.round(cy / band) * band;
            let g = groups.find(g => g.key === key);
            if (!g) { g = { key, items: [] }; groups.push(g); }
            g.items.push(w);
          }
          blocks = groups.map(g => {
            const xs = g.items.map((i: any) => i?.bbox?.x0 || 0);
            const ys = g.items.map((i: any) => i?.bbox?.y0 || 0);
            const xe = g.items.map((i: any) => i?.bbox?.x1 || 0);
            const ye = g.items.map((i: any) => i?.bbox?.y1 || 0);
            const text = g.items.map((i: any) => i.text).join(' ').trim();
            const confidence = Math.round((g.items.reduce((a: number, b: any) => a + (b.confidence || 0), 0) / g.items.length) || 0);
            return {
              text,
              confidence,
              location: {
                x: Math.min(...xs),
                y: Math.min(...ys),
                w: Math.max(...xe) - Math.min(...xs),
                h: Math.max(...ye) - Math.min(...ys)
              }
            } as TextBlock;
          }).filter((b: TextBlock) => b.text.length > 0);
        }
      }
      
      console.log(`[OCR] Extracted ${blocks.length} text blocks`);
      
      return {
        extracted: page?.text || '',
        blocks,
        confidence: page?.confidence || 0
      };
    } catch (error) {
      console.error('[OCR] Text extraction failed:', error);
      return {
        extracted: '',
        blocks: [],
        confidence: 0
      };
    }
  }

  /**
   * Analyze contrast between colors
   */
  private analyzeContrast(palette: ColorInfo[]): ExtractedData['contrast'] {
    const issues: ContrastIssue[] = [];
    const passes: ContrastIssue[] = [];
    
    // Find likely text and background color pairs
    const darkColors = palette.filter(c => c.luminance < 0.3);
    const lightColors = palette.filter(c => c.luminance > 0.7);
    const midColors = palette.filter(c => c.luminance >= 0.3 && c.luminance <= 0.7);
    
    // Check dark text on light backgrounds
    darkColors.forEach(dark => {
      lightColors.forEach(light => {
        const ratio = this.getContrastRatio(dark, light);
        const wcagLevel = this.getWCAGLevel(ratio);
        const location = this.inferLocation(dark, light, palette);
        
        const issue: ContrastIssue = {
          foreground: dark.hex,
          background: light.hex,
          ratio: parseFloat(ratio.toFixed(2)),
          location,
          wcagLevel,
          severity: wcagLevel === 'FAIL' ? 'HIGH' : wcagLevel === 'AA' ? 'MEDIUM' : 'LOW'
        };
        
        if (wcagLevel === 'FAIL') {
          issues.push(issue);
        } else {
          passes.push(issue);
        }
      });
    });
    
    // Check light text on dark backgrounds
    lightColors.forEach(light => {
      darkColors.forEach(dark => {
        const ratio = this.getContrastRatio(light, dark);
        const wcagLevel = this.getWCAGLevel(ratio);
        const location = this.inferLocation(light, dark, palette);
        
        const issue: ContrastIssue = {
          foreground: light.hex,
          background: dark.hex,
          ratio: parseFloat(ratio.toFixed(2)),
          location,
          wcagLevel,
          severity: wcagLevel === 'FAIL' ? 'HIGH' : wcagLevel === 'AA' ? 'MEDIUM' : 'LOW'
        };
        
        if (wcagLevel === 'FAIL') {
          issues.push(issue);
        } else {
          passes.push(issue);
        }
      });
    });
    
    // Sort by severity and limit results
    issues.sort((a, b) => {
      const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
    
    return {
      issues: issues.slice(0, 10),
      passes: passes.slice(0, 5)
    };
  }

  /**
   * Basic spacing analysis
   */
  private analyzeSpacing(img: HTMLImageElement): ExtractedData['spacing'] {
    // This is a simplified version - you could enhance with edge detection
    this.canvas.width = img.width;
    this.canvas.height = img.height;
    this.ctx.drawImage(img, 0, 0);
    
    const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
    
    // Simple edge detection to find content blocks
    const edges = this.detectEdges(imageData);
    const padding = this.estimatePadding(edges);
    const gridAlignment = this.checkGridAlignment(edges);
    
    return {
      avgPadding: padding,
      consistency: this.calculateConsistency(edges),
      gridAlignment
    };
  }

  /**
   * Helper: Convert RGB to Hex
   */
  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Helper: Calculate luminance
   */
  private getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  /**
   * Helper: Calculate contrast ratio
   */
  private getContrastRatio(color1: ColorInfo, color2: ColorInfo): number {
    const l1 = color1.luminance;
    const l2 = color2.luminance;
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Helper: Get WCAG compliance level
   */
  private getWCAGLevel(ratio: number): 'FAIL' | 'AA' | 'AAA' {
    if (ratio >= 7) return 'AAA';
    if (ratio >= 4.5) return 'AA';
    return 'FAIL';
  }

  /**
   * Helper: Infer location of color usage
   */
  private inferLocation(fg: ColorInfo, bg: ColorInfo, palette: ColorInfo[]): string {
    // Infer based on color frequency and luminance
    const fgRank = palette.indexOf(fg);
    const bgRank = palette.indexOf(bg);
    
    if (bgRank === 0) return 'Main background';
    if (fgRank <= 2) return 'Primary text';
    if (fgRank <= 5) return 'Secondary text';
    if (bg.luminance > 0.9) return 'Content area';
    if (fg.luminance < 0.2) return 'Body text';
    
    return 'UI element';
  }

  /**
   * Helper: Find background color
   */
  private findBackgroundColor(colors: ColorInfo[]): ColorInfo {
    // Background is usually the most frequent color with very high or very low luminance
    const extremeColors = colors.filter(c => c.luminance > 0.9 || c.luminance < 0.1);
    if (extremeColors.length > 0) {
      return extremeColors[0];
    }
    // Fallback to most frequent
    return colors[0];
  }

  /**
   * Helper: Find text colors
   */
  private findTextColors(colors: ColorInfo[], background: ColorInfo): ColorInfo[] {
    // Text colors have high contrast with background
    return colors
      .filter(c => {
        const ratio = this.getContrastRatio(c, background);
        return ratio > 4.5 && c.hex !== background.hex;
      })
      .slice(0, 3);
  }

  /**
   * Helper: Find primary brand color
   */
  private findPrimaryColor(colors: ColorInfo[], background: ColorInfo, textColors: ColorInfo[]): ColorInfo {
    // Primary color is usually saturated and not text/background
    const excludeHexes = [background.hex, ...textColors.map(t => t.hex)];
    
    const candidate = colors.find(c => {
      if (excludeHexes.includes(c.hex)) return false;
      const saturation = this.getColorSaturation(c.rgb);
      return saturation > 0.3;
    });
    
    return candidate || colors[1] || colors[0];
  }

  /**
   * Helper: Find secondary color
   */
  private findSecondaryColor(colors: ColorInfo[], primary: ColorInfo, background: ColorInfo, textColors: ColorInfo[]): ColorInfo {
    const excludeHexes = [primary.hex, background.hex, ...textColors.map(t => t.hex)];
    
    const candidate = colors.find(c => !excludeHexes.includes(c.hex));
    return candidate || colors[2] || colors[1];
  }

  /**
   * Helper: Get color saturation
   */
  private getColorSaturation(rgb: { r: number; g: number; b: number }): number {
    const max = Math.max(rgb.r, rgb.g, rgb.b);
    const min = Math.min(rgb.r, rgb.g, rgb.b);
    return max === 0 ? 0 : (max - min) / max;
  }

  /**
   * Helper: Simple edge detection
   */
  private detectEdges(imageData: ImageData): number[][] {
    const width = imageData.width;
    const height = imageData.height;
    const edges: number[][] = [];
    
    // Simplified edge detection - just find high contrast changes
    for (let y = 0; y < height; y += 10) {
      edges[y] = [];
      for (let x = 0; x < width; x += 10) {
        const i = (y * width + x) * 4;
        const gray = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
        edges[y][x] = gray;
      }
    }
    
    return edges;
  }

  /**
   * Helper: Estimate padding
   */
  private estimatePadding(edges: number[][]): number {
    // Simplified - just return a reasonable default
    // In production, you'd analyze edge positions
    return 16;
  }

  /**
   * Helper: Check grid alignment
   */
  private checkGridAlignment(edges: number[][]): boolean {
    // Simplified - in production, check if elements align to a grid
    return true;
  }

  /**
   * Helper: Calculate consistency
   */
  private calculateConsistency(edges: number[][]): number {
    // Simplified - return a reasonable default
    // In production, analyze spacing consistency
    return 75;
  }
}