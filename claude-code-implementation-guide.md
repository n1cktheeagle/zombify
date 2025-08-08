# Zombify Real Data Extraction - Claude Code Implementation Guide

## Overview
This guide will help you implement browser-based extraction to eliminate GPT hallucinations in the Zombify codebase. Follow each task sequentially. Each task includes verification steps to ensure correctness before moving to the next.

## Current Problem
- GPT-4V is hallucinating colors, text, and contrast ratios
- Components show fake data like "#3A5F7B text on #4B6C8A background" that doesn't exist
- Users don't trust the analysis because it's often wrong

## Solution
Extract REAL data from images client-side, then feed this ground truth to GPT-4V so it can't hallucinate.

---

## TASK 1: Install Dependencies and Create Extractor
**Priority: CRITICAL**
**Time: 5 minutes**

### 1.1 Install Required Packages
```bash
npm install tesseract.js
npm install @types/tesseract.js --save-dev
```

### 1.2 Create Browser Extractor Module
Create file: `lib/extractors/browserExtractor.ts`

Copy the entire browserExtractor.ts implementation provided separately into this file.

### 1.3 Verify Installation
Check that:
- [ ] tesseract.js appears in package.json
- [ ] browserExtractor.ts file exists at lib/extractors/
- [ ] No TypeScript errors in the file

---

## TASK 2: Update analyzeImage.ts to Accept Extracted Data
**Priority: CRITICAL**
**Time: 10 minutes**

### 2.1 Find and Open analyzeImage.ts
Location: Should be in your codebase (likely in lib/ or utils/)

### 2.2 Add ExtractedData Parameter
Find the main `analyzeImage` function and ADD these parameters:

```typescript
import { ExtractedData } from '@/lib/extractors/browserExtractor';

export async function analyzeImage(
  imageUrl: string,
  userContext?: string,
  extractedData?: ExtractedData, // ADD THIS
  heatmapData?: any // ADD THIS (optional, for later)
)
```

### 2.3 Add Ground Truth Context
At the beginning of the function, before building prompts, ADD:

```typescript
const groundTruthContext = extractedData ? `
EXTRACTED GROUND TRUTH DATA (USE THIS, DON'T HALLUCINATE):

REAL COLORS FOUND:
- Primary: ${extractedData.colors.primary}
- Secondary: ${extractedData.colors.secondary}
- Background: ${extractedData.colors.background}
- Text colors: ${extractedData.colors.text.join(', ')}
- Full palette: ${extractedData.colors.palette.map(c => c.hex).join(', ')}

ACTUAL TEXT CONTENT (${extractedData.text.confidence}% OCR confidence):
"${extractedData.text.extracted}"

MEASURED CONTRAST ISSUES:
${extractedData.contrast.issues.map(i => 
  `- ${i.location}: ${i.foreground} on ${i.background} = ${i.ratio}:1 (${i.wcagLevel})`
).join('\n')}

CRITICAL RULES:
1. ONLY use colors from the palette above
2. ONLY quote text from the extracted content
3. Use PROVIDED contrast ratios
4. Don't make up any data not listed above
` : '';
```

### 2.4 Add to Each Stage Prompt
Find where you build `observationPrompt`, `interpretationPrompt`, and `recommendationsPrompt`.
Add the ground truth context to EACH:

```typescript
const observationPrompt = `
${groundTruthContext}

[... rest of your existing prompt ...]
`;
```

### 2.5 Include in Final Analysis
At the end where you return the analysis, ADD:

```typescript
const finalAnalysis = {
  ...combinedAnalysis,
  extractedData, // ADD THIS
  heatmapData, // ADD THIS
};
```

### 2.6 Verify Changes
- [ ] ExtractedData is imported
- [ ] Function signature updated
- [ ] Ground truth context added to all 3 prompts
- [ ] extractedData included in return value

---

## TASK 3: Update Upload Flow to Extract Data
**Priority: CRITICAL**
**Time: 15 minutes**

### 3.1 Find Upload Component
Look for files containing:
- File upload handling
- `handleUpload` or `onUpload` functions
- FormData creation for API calls

Common locations:
- components/Upload*.tsx
- components/ImageUpload*.tsx
- app/*/upload/page.tsx

### 3.2 Import Extractor
At the top of the file, ADD:

```typescript
import { BrowserExtractor } from '@/lib/extractors/browserExtractor';
```

### 3.3 Add Extraction to Upload Handler
Find the upload handler function and MODIFY:

```typescript
const handleUpload = async (file: File) => {
  try {
    // Your existing upload start code
    setUploadStage('processing'); // or whatever you use
    
    // NEW: Extract real data
    console.log('Extracting colors and text...');
    const extractor = new BrowserExtractor();
    const extractedData = await extractor.extractAll(file, (stage, progress) => {
      console.log(`Extraction ${stage}: ${progress}%`);
      // Update your progress UI if you have one
    });
    
    console.log('Extraction complete:', extractedData);
    
    // Your existing FormData creation, but ADD extracted data
    const formData = new FormData();
    formData.append('image', file);
    formData.append('extractedData', JSON.stringify(extractedData)); // ADD THIS
    formData.append('context', userContext || '');
    
    // Your existing API call
    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData
    });
    
    // Rest of your existing code
  } catch (error) {
    console.error('Upload failed:', error);
    // Your error handling
  }
};
```

### 3.4 Verify Changes
- [ ] BrowserExtractor imported
- [ ] Extraction happens before API call
- [ ] extractedData added to FormData
- [ ] Console logs show extraction working

---

## TASK 4: Update API Route
**Priority: CRITICAL**
**Time: 10 minutes**

### 4.1 Find API Route
Look for:
- app/api/analyze/route.ts
- pages/api/analyze.ts
- Or similar analyze endpoint

### 4.2 Parse Extracted Data
In the POST handler, MODIFY to parse the extracted data:

```typescript
export async function POST(req: Request) {
  const formData = await req.formData();
  
  // Your existing code to get image, context, etc.
  const image = formData.get('image');
  const context = formData.get('context');
  
  // NEW: Get extracted data
  const extractedDataStr = formData.get('extractedData') as string;
  const extractedData = extractedDataStr ? JSON.parse(extractedDataStr) : null;
  
  // Your existing image upload/URL generation
  const imageUrl = // ... your code
  
  // Call analyzeImage WITH extracted data
  const analysis = await analyzeImage(
    imageUrl,
    context as string,
    extractedData // ADD THIS
  );
  
  // Rest of your existing code
  return NextResponse.json(analysis);
}
```

### 4.3 Verify Changes
- [ ] extractedData parsed from FormData
- [ ] Passed to analyzeImage function
- [ ] No TypeScript errors

---

## TASK 5: Update Visual Components to Show Real Data
**Priority: HIGH**
**Time: 15 minutes**

### 5.1 Update VisualDesignAnalysisCard.tsx
ADD this section at the top of the component, before the existing cards:

```typescript
{/* Real Extracted Colors Display */}
{visualDesign.extractedData?.colors && (
  <motion.div className="bg-white border-2 border-black p-4 mb-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]">
    <div className="flex items-center gap-2 mb-3">
      <span>🎨</span>
      <div className="font-semibold text-sm font-mono">ACTUAL COLORS (EXTRACTED)</div>
    </div>
    <div className="flex gap-2 flex-wrap">
      {visualDesign.extractedData.colors.palette.slice(0, 8).map((color, i) => (
        <div key={i} className="text-center">
          <div 
            className="w-12 h-12 border-2 border-black rounded"
            style={{ backgroundColor: color.hex }}
          />
          <div className="text-xs font-mono mt-1">{color.hex}</div>
          {i === 0 && <div className="text-xs opacity-60">Primary</div>}
          {i === 1 && <div className="text-xs opacity-60">Secondary</div>}
        </div>
      ))}
    </div>
  </motion.div>
)}
```

In the Contrast section, REPLACE the fake failures with:

```typescript
{visualDesign.extractedData?.contrast?.issues && visualDesign.extractedData.contrast.issues.length > 0 && (
  <div>
    <div className="text-xs font-semibold mb-1 font-mono">REAL Contrast Issues:</div>
    {visualDesign.extractedData.contrast.issues.slice(0, 5).map((issue, i) => (
      <div key={i} className="text-xs border border-red-200 bg-red-50 p-2 mb-1 rounded">
        <div className="flex justify-between font-mono">
          <span>{issue.location}</span>
          <span className="font-bold">{issue.ratio}:1</span>
        </div>
        <div className="text-red-600">
          {issue.foreground} on {issue.background} - {issue.wcagLevel}
        </div>
      </div>
    ))}
  </div>
)}
```

### 5.2 Update UXCopyAnalysisCard.tsx
ADD this at the very top of the component, before score card:

```typescript
{/* Real Extracted Text Display */}
{uxCopy.extractedData?.text && (
  <motion.div className="bg-blue-50 border-2 border-blue-200 p-4 mb-4">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <span>📝</span>
        <div className="font-semibold text-sm font-mono">EXTRACTED TEXT (OCR)</div>
      </div>
      <div className="text-xs font-mono text-blue-600">
        {uxCopy.extractedData.text.confidence}% confidence
      </div>
    </div>
    <div className="text-sm font-mono text-black/80 max-h-40 overflow-y-auto whitespace-pre-wrap">
      {uxCopy.extractedData.text.extracted}
    </div>
    {uxCopy.extractedData.text.confidence < 70 && (
      <div className="text-xs text-orange-600 mt-2">
        ⚠️ Low OCR confidence - upload a higher resolution image for better results
      </div>
    )}
  </motion.div>
)}
```

### 5.3 Verify Visual Updates
- [ ] Colors display in VisualDesignAnalysisCard
- [ ] Contrast issues show real hex codes
- [ ] Extracted text appears in UXCopyAnalysisCard
- [ ] OCR confidence shown

---

## TASK 6: Test the Implementation
**Priority: CRITICAL**
**Time: 10 minutes**

### 6.1 Test Color Extraction
1. Upload an image with clear colors
2. Open browser console
3. Look for "Extraction complete:" log
4. Verify colors object has hex codes

### 6.2 Test Text Extraction
1. Upload an image with readable text
2. Check console for "[OCR] Progress:" logs
3. Verify extracted text appears in UXCopyAnalysisCard

### 6.3 Test Contrast Analysis
1. Check VisualDesignAnalysisCard
2. Verify contrast issues show specific hex codes
3. Confirm ratios are numbers (not "low" or "poor")

### 6.4 Verify No More Hallucinations
Check that analysis:
- [ ] Only mentions colors from extracted palette
- [ ] Only quotes text from OCR
- [ ] Shows real contrast ratios with hex codes
- [ ] No generic "improve trust" without evidence

---

## TASK 7: Optional - Add Progress Indicators
**Priority: NICE TO HAVE**
**Time: 10 minutes**

### 7.1 Update Upload Progress UI
In your upload component, show extraction stages:

```typescript
const [extractionStage, setExtractionStage] = useState('');

// In extraction
const extractedData = await extractor.extractAll(file, (stage, progress) => {
  setExtractionStage(`${stage}: ${progress}%`);
});

// In UI
{extractionStage && (
  <div className="text-sm font-mono">
    Extracting {extractionStage}
  </div>
)}
```

---

## TASK 8: Optional - Add Attention Heatmaps
**Priority: FUTURE ENHANCEMENT**
**Time: 20 minutes**

### 8.1 Create Attention Insight Integration
Create file: `lib/heatmap/attentionInsight.ts`

```typescript
export interface HeatmapData {
  heatmapUrl: string;
  clarityScore: number;
  attentionPercentages: Array<{
    region: string;
    percentage: number;
  }>;
}

export async function generateHeatmap(file: File): Promise<HeatmapData> {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch('https://api.attentioninsight.com/v1/heatmap', {
    headers: {
      'API-Key': process.env.NEXT_PUBLIC_ATTENTION_INSIGHT_KEY!
    },
    method: 'POST',
    body: formData
  });
  
  return response.json();
}
```

### 8.2 Add to Upload Flow
```typescript
// After extraction, before API call
let heatmapData = null;
if (isPro) { // Only for pro users
  try {
    heatmapData = await generateHeatmap(file);
  } catch (error) {
    console.error('Heatmap generation failed:', error);
  }
}

// Add to FormData
if (heatmapData) {
  formData.append('heatmapData', JSON.stringify(heatmapData));
}
```

---

## Verification Checklist

### Core Implementation
- [ ] browserExtractor.ts created and working
- [ ] analyzeImage.ts accepts extractedData
- [ ] Upload flow extracts data before API call
- [ ] API route passes extracted data to analysis
- [ ] Visual components show real data

### Quality Checks
- [ ] No TypeScript errors
- [ ] Console shows extraction logs
- [ ] Colors are real hex codes
- [ ] Text matches what's in image
- [ ] Contrast ratios are specific numbers

### User Experience
- [ ] Analysis feels more trustworthy
- [ ] No obvious hallucinations
- [ ] Specific feedback instead of generic
- [ ] Real evidence for each issue

---

## Troubleshooting

### OCR Not Working?
- Check console for Tesseract errors
- Ensure image isn't too large (resize if >2MB)
- Try a clearer image with better text

### Colors Look Wrong?
- Check image isn't heavily compressed
- Ensure canvas is loading properly
- Look at console for extraction logs

### Analysis Still Hallucinating?
- Verify groundTruthContext is in all 3 prompts
- Check extractedData is being passed through
- Ensure prompts have "CRITICAL RULES" section

---

## Success Metrics

Before implementation:
- "Improve trust signals" (generic)
- "#3A5F7B text on #4B6C8A" (made up)
- "Your CTA says 'Get Started'" (wrong)

After implementation:
- "#888888 text on #FFFFFF has 2.9:1 contrast"
- "Your CTA 'Start Free Trial' gets 23% attention"
- "Primary color #2563EB could use warmer accent"

---

## Next Steps

Once this is working:
1. Add image quality detection
2. Implement caching for repeated images
3. Add support for multiple image formats
4. Create feedback database for learning

---

## Notes for Claude Code

- Follow tasks sequentially
- Verify each task before moving on
- Check console logs frequently
- Test with real images after each major change
- Commit after each successful task