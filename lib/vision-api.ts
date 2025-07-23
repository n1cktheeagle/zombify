// lib/vision-api.ts - Google Vision API integration for spatial analysis
import { ImageAnnotatorClient } from '@google-cloud/vision';

export interface VisionTextAnnotation {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fontSize?: number;
  fontWeight?: string;
}

export interface VisionAnalysisResult {
  textAnnotations: VisionTextAnnotation[];
  logoAnnotations: Array<{
    description: string;
    confidence: number;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  imageProperties: {
    dominantColors: Array<{
      color: { red: number; green: number; blue: number };
      score: number;
      pixelFraction: number;
    }>;
  };
  webDetection?: {
    webEntities: Array<{
      entityId: string;
      description: string;
      score: number;
    }>;
    bestGuessLabels: Array<{
      label: string;
      languageCode: string;
    }>;
  };
}

// Helper function to convert Vision API bounding box to our format
function convertBoundingBox(vertices: any[]): { x: number; y: number; width: number; height: number } {
  if (!vertices || vertices.length < 4) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const xs = vertices.map(v => v.x || 0);
  const ys = vertices.map(v => v.y || 0);
  
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

export async function analyzeImageWithVision(imageUrl: string): Promise<VisionAnalysisResult> {
  console.log('[VISION_API] Starting analysis for:', imageUrl);

  try {
    // Initialize Vision client with API key
    const client = new ImageAnnotatorClient({
      apiKey: process.env.GOOGLE_CLOUD_VISION_API_KEY
    });

    // Perform multiple detection types in parallel
    const [
      textResult,
      logoResult,
      propertiesResult,
      webResult
    ] = await Promise.all([
      client.textDetection({ image: { source: { imageUri: imageUrl } } }),
      client.logoDetection({ image: { source: { imageUri: imageUrl } } }),
      client.imageProperties({ image: { source: { imageUri: imageUrl } } }),
      client.webDetection({ image: { source: { imageUri: imageUrl } } })
    ]);

    console.log('[VISION_API] All detections completed');

    // Process text annotations
    const textAnnotations: VisionTextAnnotation[] = [];
    if (textResult[0].textAnnotations && textResult[0].textAnnotations.length > 1) {
      // Skip the first annotation as it's the full text, we want individual words/phrases
      for (let i = 1; i < textResult[0].textAnnotations.length; i++) {
        const annotation = textResult[0].textAnnotations[i];
        if (annotation.description && annotation.boundingPoly?.vertices) {
          textAnnotations.push({
            text: annotation.description,
            confidence: 0.9, // Vision API doesn't provide confidence for text, using default
            boundingBox: convertBoundingBox(annotation.boundingPoly.vertices)
          });
        }
      }
    }

    // Process logo annotations
    const logoAnnotations = (logoResult[0].logoAnnotations || []).map(logo => ({
      description: logo.description || '',
      confidence: logo.score || 0,
      boundingBox: convertBoundingBox(logo.boundingPoly?.vertices || [])
    }));

    // Process color properties
    const dominantColors = (propertiesResult[0].imagePropertiesAnnotation?.dominantColors?.colors || []).map(colorInfo => ({
      color: {
        red: Math.round(colorInfo.color?.red || 0),
        green: Math.round(colorInfo.color?.green || 0),
        blue: Math.round(colorInfo.color?.blue || 0)
      },
      score: colorInfo.score || 0,
      pixelFraction: colorInfo.pixelFraction || 0
    }));

    // Process web detection
    const webDetection = webResult[0].webDetection ? {
      webEntities: (webResult[0].webDetection.webEntities || []).map(entity => ({
        entityId: entity.entityId || '',
        description: entity.description || '',
        score: entity.score || 0
      })),
      bestGuessLabels: (webResult[0].webDetection.bestGuessLabels || []).map(label => ({
        label: label.label || '',
        languageCode: label.languageCode || 'en'
      }))
    } : undefined;

    const result: VisionAnalysisResult = {
      textAnnotations,
      logoAnnotations,
      imageProperties: {
        dominantColors
      },
      webDetection
    };

    console.log('[VISION_API] Analysis completed successfully:', {
      textCount: textAnnotations.length,
      logoCount: logoAnnotations.length,
      colorCount: dominantColors.length
    });

    return result;

  } catch (error) {
    console.error('[VISION_API] Analysis failed:', error);
    throw new Error(`Vision API analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}