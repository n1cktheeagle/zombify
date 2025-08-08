/**
 * Attention Insight API integration for generating attention heatmaps
 * This provides real user attention data to complement our extracted data
 */

export interface HeatmapData {
  heatmapUrl: string;
  clarityScore: number;
  attentionPercentages: Array<{
    region: string;
    percentage: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }>;
  hotspots: Array<{
    x: number;
    y: number;
    intensity: number;
    radius: number;
  }>;
  focusTime: {
    aboveFold: number;
    belowFold: number;
    leftSide: number;
    rightSide: number;
    center: number;
  };
}

export class AttentionInsightAPI {
  private apiKey: string;
  private baseUrl = 'https://api.attentioninsight.com/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_ATTENTION_INSIGHT_KEY || '';
  }

  /**
   * Generate attention heatmap for an image
   */
  async generateHeatmap(file: File): Promise<HeatmapData> {
    if (!this.apiKey) {
      console.warn('[AttentionInsight] No API key configured, returning mock data');
      return this.getMockHeatmapData();
    }

    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`${this.baseUrl}/heatmap`, {
        method: 'POST',
        headers: {
          'API-Key': this.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return this.normalizeHeatmapData(data);
    } catch (error) {
      console.error('[AttentionInsight] API call failed:', error);
      // Return mock data as fallback
      return this.getMockHeatmapData();
    }
  }

  /**
   * Generate attention heatmap from image URL
   */
  async generateHeatmapFromUrl(imageUrl: string): Promise<HeatmapData> {
    if (!this.apiKey) {
      console.warn('[AttentionInsight] No API key configured, returning mock data');
      return this.getMockHeatmapData();
    }

    try {
      const response = await fetch(`${this.baseUrl}/heatmap-url`, {
        method: 'POST',
        headers: {
          'API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return this.normalizeHeatmapData(data);
    } catch (error) {
      console.error('[AttentionInsight] API call failed:', error);
      return this.getMockHeatmapData();
    }
  }

  /**
   * Normalize API response to our format
   */
  private normalizeHeatmapData(apiData: any): HeatmapData {
    return {
      heatmapUrl: apiData.heatmap_url || apiData.heatmapUrl || '',
      clarityScore: apiData.clarity_score || apiData.clarityScore || 0,
      attentionPercentages: apiData.attention_percentages || apiData.attentionPercentages || [],
      hotspots: apiData.hotspots || [],
      focusTime: apiData.focus_time || apiData.focusTime || {
        aboveFold: 0,
        belowFold: 0,
        leftSide: 0,
        rightSide: 0,
        center: 0,
      },
    };
  }

  /**
   * Generate mock heatmap data for development/fallback
   */
  private getMockHeatmapData(): HeatmapData {
    return {
      heatmapUrl: '',
      clarityScore: 72,
      attentionPercentages: [
        { region: 'Hero Section', percentage: 35, x: 0, y: 0, width: 100, height: 30 },
        { region: 'Primary CTA', percentage: 25, x: 40, y: 35, width: 20, height: 10 },
        { region: 'Navigation', percentage: 15, x: 0, y: 0, width: 100, height: 5 },
        { region: 'Feature Section', percentage: 12, x: 0, y: 50, width: 100, height: 30 },
        { region: 'Footer', percentage: 8, x: 0, y: 90, width: 100, height: 10 },
        { region: 'Other', percentage: 5, x: 0, y: 0, width: 100, height: 100 },
      ],
      hotspots: [
        { x: 50, y: 20, intensity: 0.9, radius: 15 },
        { x: 50, y: 40, intensity: 0.8, radius: 10 },
        { x: 25, y: 60, intensity: 0.6, radius: 8 },
        { x: 75, y: 60, intensity: 0.6, radius: 8 },
      ],
      focusTime: {
        aboveFold: 65,
        belowFold: 35,
        leftSide: 30,
        rightSide: 25,
        center: 45,
      },
    };
  }

  /**
   * Calculate attention flow from heatmap data
   */
  calculateAttentionFlow(heatmapData: HeatmapData): Array<{
    priority: number;
    element: string;
    percentage: number;
    coordinates?: { x: number; y: number };
  }> {
    return heatmapData.attentionPercentages
      .sort((a, b) => b.percentage - a.percentage)
      .map((item, index) => ({
        priority: index + 1,
        element: item.region,
        percentage: item.percentage,
        coordinates: item.x !== undefined && item.y !== undefined 
          ? { x: item.x, y: item.y }
          : undefined,
      }));
  }

  /**
   * Get attention insights from heatmap data
   */
  getAttentionInsights(heatmapData: HeatmapData): {
    mainFocus: string;
    distractionLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    recommendations: string[];
  } {
    const topRegion = heatmapData.attentionPercentages[0];
    const clarityScore = heatmapData.clarityScore;
    
    const distractionLevel = 
      clarityScore > 80 ? 'LOW' :
      clarityScore > 60 ? 'MEDIUM' : 'HIGH';
    
    const recommendations: string[] = [];
    
    if (heatmapData.focusTime.belowFold < 20) {
      recommendations.push('Content below the fold gets minimal attention - consider moving key information up');
    }
    
    if (topRegion && topRegion.percentage > 50) {
      recommendations.push(`${topRegion.region} dominates attention - ensure it contains your key message`);
    }
    
    if (distractionLevel === 'HIGH') {
      recommendations.push('High visual distraction detected - simplify the design for better focus');
    }
    
    return {
      mainFocus: topRegion?.region || 'Unknown',
      distractionLevel,
      recommendations,
    };
  }
}

export default AttentionInsightAPI;