'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { VisualDesignAnalysis } from '@/types/analysis';
import GlitchText from './GlitchText';

interface VisualDesignAnalysisCardProps {
  visualDesign: VisualDesignAnalysis;
}

export default function VisualDesignAnalysisCard({ visualDesign }: VisualDesignAnalysisCardProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

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

  const sections = [
    {
      key: 'typography',
      label: 'Typography',
      icon: '🔤',
      data: visualDesign.typography,
      color: 'text-blue-600'
    },
    {
      key: 'colorAndContrast',
      label: 'Color & Contrast',
      icon: '🎨',
      data: visualDesign.colorAndContrast,
      color: 'text-purple-600'
    },
    {
      key: 'spacing',
      label: 'Spacing',
      icon: '📏',
      data: visualDesign.spacing,
      color: 'text-green-600'
    },
    {
      key: 'modernPatterns',
      label: 'Modern Patterns',
      icon: '✨',
      data: visualDesign.modernPatterns,
      color: 'text-pink-600'
    },
    {
      key: 'visualHierarchy',
      label: 'Visual Hierarchy',
      icon: '👁️',
      data: visualDesign.visualHierarchy,
      color: 'text-orange-600'
    }
  ];

  return (
    <motion.div 
      className="zombify-card p-6 scan-line relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <GlitchText className="text-lg font-bold mb-2" trigger="mount">
          VISUAL DESIGN ANALYSIS
        </GlitchText>
        <motion.div 
          className={`text-4xl font-bold mb-2 ${getScoreColor(visualDesign.score)}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          {visualDesign.score}
          <span className="text-lg opacity-60">/100</span>
        </motion.div>
        <div className="text-sm opacity-60 font-mono">Visual design effectiveness</div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((section, index) => {
          const isExpanded = expandedSection === section.key;
          const sectionData = section.data as any;

          return (
            <motion.div
              key={section.key}
              className={`border rounded-lg overflow-hidden ${getScoreBg(sectionData.score || 0)}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <motion.div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedSection(isExpanded ? null : section.key)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{section.icon}</span>
                    <div>
                      <div className="font-semibold text-sm">{section.label}</div>
                      <div className="text-xs opacity-70">
                        {sectionData.score || 0}/100
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-gray-400"
                    >
                      ▼
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t bg-white/50">
                      <div className="mt-3 space-y-3">
                        {/* Typography Section */}
                        {section.key === 'typography' && (
                          <div>
                            <div className="text-sm font-semibold mb-2">Hierarchy Analysis:</div>
                            <div className="text-xs mb-2">
                              H1:H2 Ratio: {sectionData.hierarchy?.h1ToH2Ratio || 'N/A'}
                            </div>
                            <div className="text-xs mb-2">
                              Consistency: {sectionData.hierarchy?.consistencyScore || 'N/A'}/100
                            </div>
                            <div className="text-xs mb-3">
                              {sectionData.hierarchy?.recommendation || 'No recommendation available'}
                            </div>
                            
                            <div className="text-sm font-semibold mb-2">Readability:</div>
                            <div className="text-xs mb-2">
                              Flesch Score: {sectionData.readability?.fleschScore || 'N/A'}
                            </div>
                            <div className="text-xs mb-2">
                              Avg Line Length: {sectionData.readability?.avgLineLength || 'N/A'} chars
                            </div>
                            <div className="text-xs">
                              {sectionData.readability?.recommendation || 'No recommendation available'}
                            </div>
                          </div>
                        )}

                        {/* Color & Contrast Section */}
                        {section.key === 'colorAndContrast' && (
                          <div>
                            <div className="text-sm font-semibold mb-2">Color Harmony:</div>
                            <div className="text-xs mb-2">
                              Scheme: {sectionData.colorHarmony?.scheme || 'Unknown'}
                            </div>
                            <div className="text-xs mb-3">
                              {sectionData.colorHarmony?.accentSuggestion || 'No suggestion available'}
                            </div>
                            
                            {sectionData.contrastFailures && sectionData.contrastFailures.length > 0 && (
                              <div>
                                <div className="text-sm font-semibold mb-2">Contrast Issues:</div>
                                <div className="text-xs space-y-1">
                                  {sectionData.contrastFailures.slice(0, 3).map((failure: any, i: number) => (
                                    <div key={i} className="flex justify-between">
                                      <span>{failure.location}</span>
                                      <span className="text-red-600">{failure.ratio}:1</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Spacing Section */}
                        {section.key === 'spacing' && (
                          <div>
                            <div className="text-sm font-semibold mb-2">Grid System:</div>
                            <div className="text-xs mb-2">
                              System: {sectionData.gridSystem || 'Unknown'}
                            </div>
                            <div className="text-xs mb-3">
                              Consistency: {sectionData.consistency || 0}/100
                            </div>
                            
                            {sectionData.issues && sectionData.issues.length > 0 && (
                              <div>
                                <div className="text-sm font-semibold mb-2">Issues:</div>
                                <div className="text-xs space-y-1">
                                  {sectionData.issues.slice(0, 3).map((issue: any, i: number) => (
                                    <div key={i} className="flex justify-between">
                                      <span>{issue.element}</span>
                                      <span className="text-blue-600">{issue.suggestion}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Modern Patterns Section */}
                        {section.key === 'modernPatterns' && (
                          <div>
                            <div className="text-sm font-semibold mb-2">2025 Relevance:</div>
                            <div className="text-xs mb-2">
                              Score: {sectionData.trendAlignment?.['2025Relevance'] || 0}/100
                            </div>
                            
                            {sectionData.detected && sectionData.detected.length > 0 && (
                              <div className="mb-3">
                                <div className="text-sm font-semibold mb-2">Detected Patterns:</div>
                                <div className="text-xs space-y-1">
                                  {sectionData.detected.slice(0, 3).map((pattern: string, i: number) => (
                                    <div key={i} className="flex items-center gap-2">
                                      <span className="text-green-600">✓</span>
                                      <span>{pattern}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {sectionData.trendAlignment?.suggestions && sectionData.trendAlignment.suggestions.length > 0 && (
                              <div>
                                <div className="text-sm font-semibold mb-2">Suggestions:</div>
                                <div className="text-xs space-y-1">
                                  {sectionData.trendAlignment.suggestions.slice(0, 2).map((suggestion: string, i: number) => (
                                    <div key={i} className="flex items-start gap-2">
                                      <span className="text-blue-600 mt-1">•</span>
                                      <span>{suggestion}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Visual Hierarchy Section */}
                        {section.key === 'visualHierarchy' && (
                          <div>
                            <div className="text-sm font-semibold mb-2">Scan Pattern:</div>
                            <div className="text-xs mb-3">
                              {sectionData.scanPattern || 'Unknown'}
                            </div>
                            
                            {sectionData.focalPoints && sectionData.focalPoints.length > 0 && (
                              <div className="mb-3">
                                <div className="text-sm font-semibold mb-2">Focal Points:</div>
                                <div className="text-xs space-y-1">
                                  {sectionData.focalPoints.slice(0, 3).map((point: any, i: number) => (
                                    <div key={i} className="flex justify-between">
                                      <span>{point.element}</span>
                                      <span className="text-orange-600">Weight: {point.weight}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {sectionData.improvements && sectionData.improvements.length > 0 && (
                              <div>
                                <div className="text-sm font-semibold mb-2">Improvements:</div>
                                <div className="text-xs space-y-1">
                                  {sectionData.improvements.slice(0, 2).map((improvement: any, i: number) => (
                                    <div key={i} className="flex items-start gap-2">
                                      <span className="text-green-600 mt-1">→</span>
                                      <span>{improvement.fix}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Scanning line effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent pointer-events-none"
        animate={{
          y: ['-100%', '100%']
        }}
        transition={{
          repeat: Infinity,
          duration: 4,
          ease: "linear"
        }}
        style={{ height: '20px' }}
      />
    </motion.div>
  );
} 