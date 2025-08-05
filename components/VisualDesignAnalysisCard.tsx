'use client';

import { motion } from 'framer-motion';
import { VisualDesignAnalysis } from '@/types/analysis';

interface VisualDesignAnalysisCardProps {
  visualDesign: VisualDesignAnalysis;
}

export default function VisualDesignAnalysisCard({ visualDesign }: VisualDesignAnalysisCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-4">
      {/* Main Score Card */}
      <motion.div 
        className="border-2 border-black bg-[#f5f1e6] p-4 relative overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="text-center">
          <div className="text-lg font-bold mb-2 font-mono tracking-wider">
            VISUAL DESIGN ANALYSIS
          </div>
          <motion.div 
            className={`text-3xl font-bold mb-2 ${getScoreColor(visualDesign.score)} font-mono`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            {visualDesign.score}
            <span className="text-lg opacity-60">/100</span>
          </motion.div>
          <div className="text-xs opacity-60 font-mono">Visual design effectiveness</div>
        </div>
      </motion.div>

      {/* Typography Card */}
      <motion.div
        className="bg-white border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] p-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">🔤</span>
          <div className="font-semibold text-sm font-mono tracking-wider">TYPOGRAPHY</div>
          <div className={`ml-auto text-sm font-bold ${getScoreColor(visualDesign.typography.score || 0)} font-mono`}>
            {visualDesign.typography.score || 0}/100
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold mb-1 font-mono">Hierarchy Analysis:</div>
            <div className="text-xs mb-1 font-mono">
              H1:H2 Ratio: {visualDesign.typography.hierarchy?.h1ToH2Ratio || 'N/A'}
            </div>
            <div className="text-xs mb-1 font-mono">
              Consistency: {visualDesign.typography.hierarchy?.consistencyScore || 'N/A'}/100
            </div>
            <div className="text-xs mb-2 font-mono opacity-80">
              {visualDesign.typography.hierarchy?.recommendation || 'No recommendation available'}
            </div>
          </div>
          
          <div>
            <div className="text-xs font-semibold mb-1 font-mono">Readability:</div>
            <div className="text-xs mb-1 font-mono">
              Flesch Score: {visualDesign.typography.readability?.fleschScore || 'N/A'}
            </div>
            <div className="text-xs mb-1 font-mono">
              Avg Line Length: {visualDesign.typography.readability?.avgLineLength || 'N/A'} chars
            </div>
            <div className="text-xs font-mono opacity-80">
              {visualDesign.typography.readability?.recommendation || 'No recommendation available'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Color & Contrast Card */}
      <motion.div
        className="bg-white border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] p-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">🎨</span>
          <div className="font-semibold text-sm font-mono tracking-wider">COLOR & CONTRAST</div>
          <div className={`ml-auto text-sm font-bold ${getScoreColor(visualDesign.colorAndContrast.score || 0)} font-mono`}>
            {visualDesign.colorAndContrast.score || 0}/100
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold mb-1 font-mono">Color Harmony:</div>
            <div className="text-xs mb-1 font-mono">
              Scheme: {visualDesign.colorAndContrast.colorHarmony?.scheme || 'Unknown'}
            </div>
            <div className="text-xs mb-2 font-mono opacity-80">
              {visualDesign.colorAndContrast.colorHarmony?.accentSuggestion || 'No suggestion available'}
            </div>
          </div>
          
          {visualDesign.colorAndContrast.contrastFailures && visualDesign.colorAndContrast.contrastFailures.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-1 font-mono">Contrast Issues:</div>
              <div className="text-xs space-y-1">
                {visualDesign.colorAndContrast.contrastFailures.slice(0, 3).map((failure: any, i: number) => (
                  <div key={i} className="flex justify-between font-mono">
                    <span>{failure.location}</span>
                    <span className="text-red-600">{failure.ratio}:1</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Vision API Enhanced Colors */}
          {visualDesign.colorAndContrast.detectedColors && visualDesign.colorAndContrast.detectedColors.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-1 font-mono">Detected Colors:</div>
              <div className="flex gap-1 flex-wrap">
                {visualDesign.colorAndContrast.detectedColors.slice(0, 8).map((color: string, i: number) => (
                  <div 
                    key={i} 
                    className="w-6 h-6 border border-black rounded"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Spacing Card */}
      <motion.div
        className="bg-white border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] p-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">📏</span>
          <div className="font-semibold text-sm font-mono tracking-wider">SPACING</div>
          <div className={`ml-auto text-sm font-bold ${getScoreColor(visualDesign.spacing.score || 0)} font-mono`}>
            {visualDesign.spacing.score || 0}/100
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold mb-1 font-mono">Grid System:</div>
            <div className="text-xs mb-1 font-mono">
              System: {visualDesign.spacing.gridSystem || 'Unknown'}
            </div>
            <div className="text-xs mb-2 font-mono">
              Consistency: {visualDesign.spacing.consistency || 0}/100
            </div>
          </div>
          
          {visualDesign.spacing.issues && visualDesign.spacing.issues.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-1 font-mono">Issues:</div>
              <div className="text-xs space-y-1">
                {visualDesign.spacing.issues.slice(0, 3).map((issue: any, i: number) => (
                  <div key={i} className="flex justify-between font-mono">
                    <span>{issue.element}</span>
                    <span className="text-blue-600">{issue.suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Modern Patterns Card */}
      <motion.div
        className="bg-white border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] p-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">✨</span>
          <div className="font-semibold text-sm font-mono tracking-wider">MODERN PATTERNS</div>
          <div className={`ml-auto text-sm font-bold ${getScoreColor(visualDesign.modernPatterns.score || 0)} font-mono`}>
            {visualDesign.modernPatterns.score || 0}/100
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold mb-1 font-mono">2025 Relevance:</div>
            <div className="text-xs mb-2 font-mono">
              Score: {visualDesign.modernPatterns.trendAlignment?.['2025Relevance'] || 0}/100
            </div>
          </div>
          
          {visualDesign.modernPatterns.detected && visualDesign.modernPatterns.detected.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-1 font-mono">Detected Patterns:</div>
              <div className="text-xs space-y-1">
                {visualDesign.modernPatterns.detected.slice(0, 3).map((pattern: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 font-mono">
                    <span className="text-green-600">✓</span>
                    <span>{pattern}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {visualDesign.modernPatterns.trendAlignment?.suggestions && visualDesign.modernPatterns.trendAlignment.suggestions.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-1 font-mono">Suggestions:</div>
              <div className="text-xs space-y-1">
                {visualDesign.modernPatterns.trendAlignment.suggestions.slice(0, 2).map((suggestion: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 font-mono">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Visual Hierarchy Card */}
      <motion.div
        className="bg-white border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] p-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">👁️</span>
          <div className="font-semibold text-sm font-mono tracking-wider">VISUAL HIERARCHY</div>
          <div className={`ml-auto text-sm font-bold ${getScoreColor(visualDesign.visualHierarchy.score || 0)} font-mono`}>
            {visualDesign.visualHierarchy.score || 0}/100
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold mb-1 font-mono">Scan Pattern:</div>
            <div className="text-xs mb-2 font-mono">
              {visualDesign.visualHierarchy.scanPattern || 'Unknown'}
            </div>
          </div>
          
          {visualDesign.visualHierarchy.focalPoints && visualDesign.visualHierarchy.focalPoints.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-1 font-mono">Focal Points:</div>
              <div className="text-xs space-y-1">
                {visualDesign.visualHierarchy.focalPoints.slice(0, 3).map((point: any, i: number) => (
                  <div key={i} className="flex justify-between font-mono">
                    <span>{point.element}</span>
                    <span className="text-orange-600">Weight: {point.weight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {visualDesign.visualHierarchy?.improvements && visualDesign.visualHierarchy.improvements.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-1 font-mono">Improvements:</div>
              <div className="text-xs space-y-1">
                {visualDesign.visualHierarchy.improvements.slice(0, 2).map((improvement: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 font-mono">
                    <span className="text-green-600 mt-0.5">→</span>
                    <span>{improvement.fix}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* NEW: Tile Feedback Section */}
          {visualDesign.tileFeedback && visualDesign.tileFeedback.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-1 font-mono">Design Feedback:</div>
              <div className="text-xs space-y-2">
                {visualDesign.tileFeedback.slice(0, 3).map((tile: any, i: number) => (
                  <div key={i} className="border border-gray-200 p-2 rounded bg-gray-50">
                    <div className="font-semibold text-blue-600 mb-1">{tile.area}</div>
                    <div className="text-black/80">{tile.feedback}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Confidence: {Math.round((tile.confidence || 0) * 100)}%
                    </div>
                  </div>
                ))}
                {visualDesign.tileFeedback.length > 3 && (
                  <div className="text-xs opacity-60 font-mono text-center">
                    +{visualDesign.tileFeedback.length - 3} more feedback items
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Vision API Enhanced Data Card */}
      {(visualDesign.detectedText || visualDesign.detectedLogos) && (
        <motion.div
          className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] p-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">🤖</span>
            <div className="font-semibold text-sm font-mono tracking-wider">AI VISION DETECTION</div>
            <div className="ml-auto text-xs bg-purple-600 text-white px-2 py-1 rounded font-mono">ENHANCED</div>
          </div>
          
          <div className="space-y-3">
            {/* Detected Text */}
            {visualDesign.detectedText && visualDesign.detectedText.length > 0 && (
              <div>
                <div className="text-xs font-semibold mb-1 font-mono">Detected Text Elements:</div>
                <div className="text-xs space-y-1">
                  {visualDesign.detectedText.slice(0, 5).map((text: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 font-mono bg-white/50 p-1 rounded">
                      <span className="text-purple-600">📝</span>
                      <span className="truncate">{text}</span>
                    </div>
                  ))}
                  {visualDesign.detectedText.length > 5 && (
                    <div className="text-xs opacity-60 font-mono text-center">
                      +{visualDesign.detectedText.length - 5} more text elements
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Detected Logos */}
            {visualDesign.detectedLogos && visualDesign.detectedLogos.length > 0 && (
              <div>
                <div className="text-xs font-semibold mb-1 font-mono">Detected Brand Elements:</div>
                <div className="text-xs space-y-1">
                  {visualDesign.detectedLogos.map((logo: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 font-mono bg-white/50 p-1 rounded">
                      <span className="text-blue-600">🏷️</span>
                      <span>{logo}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}