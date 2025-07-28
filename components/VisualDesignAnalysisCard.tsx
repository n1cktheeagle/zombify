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
      className="border-2 border-black bg-[#f5f1e6] p-4 relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="text-center mb-4">
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

      {/* Sections */}
      <div className="space-y-2">
        {sections.map((section, index) => {
          const isExpanded = expandedSection === section.key;
          const sectionData = section.data as any;

          return (
            <motion.div
              key={section.key}
              className="bg-white border-2 border-black overflow-hidden shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <motion.div
                className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedSection(isExpanded ? null : section.key)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{section.icon}</span>
                    <div>
                      <div className="font-semibold text-xs font-mono tracking-wider">{section.label}</div>
                      <div className="text-xs opacity-70">
                        {sectionData.score || 0}/100
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`text-xs font-bold ${getScoreColor(sectionData.score || 0)} font-mono`}>
                      {sectionData.score || 0}
                    </div>
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
                    <div className="px-3 pb-3 border-t border-black/20 bg-black/5">
                      <div className="mt-2 space-y-2">
                        {/* Typography Section */}
                        {section.key === 'typography' && (
                          <div>
                            <div className="text-xs font-semibold mb-1 font-mono">Hierarchy Analysis:</div>
                            <div className="text-xs mb-1 font-mono">
                              H1:H2 Ratio: {sectionData.hierarchy?.h1ToH2Ratio || 'N/A'}
                            </div>
                            <div className="text-xs mb-1 font-mono">
                              Consistency: {sectionData.hierarchy?.consistencyScore || 'N/A'}/100
                            </div>
                            <div className="text-xs mb-2 font-mono opacity-80">
                              {sectionData.hierarchy?.recommendation || 'No recommendation available'}
                            </div>
                            
                            <div className="text-xs font-semibold mb-1 font-mono">Readability:</div>
                            <div className="text-xs mb-1 font-mono">
                              Flesch Score: {sectionData.readability?.fleschScore || 'N/A'}
                            </div>
                            <div className="text-xs mb-1 font-mono">
                              Avg Line Length: {sectionData.readability?.avgLineLength || 'N/A'} chars
                            </div>
                            <div className="text-xs font-mono opacity-80">
                              {sectionData.readability?.recommendation || 'No recommendation available'}
                            </div>
                          </div>
                        )}

                        {/* Color & Contrast Section */}
                        {section.key === 'colorAndContrast' && (
                          <div>
                            <div className="text-xs font-semibold mb-1 font-mono">Color Harmony:</div>
                            <div className="text-xs mb-1 font-mono">
                              Scheme: {sectionData.colorHarmony?.scheme || 'Unknown'}
                            </div>
                            <div className="text-xs mb-2 font-mono opacity-80">
                              {sectionData.colorHarmony?.accentSuggestion || 'No suggestion available'}
                            </div>
                            
                            {sectionData.contrastFailures && sectionData.contrastFailures.length > 0 && (
                              <div>
                                <div className="text-xs font-semibold mb-1 font-mono">Contrast Issues:</div>
                                <div className="text-xs space-y-1">
                                  {sectionData.contrastFailures.slice(0, 3).map((failure: any, i: number) => (
                                    <div key={i} className="flex justify-between font-mono">
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
                            <div className="text-xs font-semibold mb-1 font-mono">Grid System:</div>
                            <div className="text-xs mb-1 font-mono">
                              System: {sectionData.gridSystem || 'Unknown'}
                            </div>
                            <div className="text-xs mb-2 font-mono">
                              Consistency: {sectionData.consistency || 0}/100
                            </div>
                            
                            {sectionData.issues && sectionData.issues.length > 0 && (
                              <div>
                                <div className="text-xs font-semibold mb-1 font-mono">Issues:</div>
                                <div className="text-xs space-y-1">
                                  {sectionData.issues.slice(0, 3).map((issue: any, i: number) => (
                                    <div key={i} className="flex justify-between font-mono">
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
                            <div className="text-xs font-semibold mb-1 font-mono">2025 Relevance:</div>
                            <div className="text-xs mb-2 font-mono">
                              Score: {sectionData.trendAlignment?.['2025Relevance'] || 0}/100
                            </div>
                            
                            {sectionData.detected && sectionData.detected.length > 0 && (
                              <div className="mb-2">
                                <div className="text-xs font-semibold mb-1 font-mono">Detected Patterns:</div>
                                <div className="text-xs space-y-1">
                                  {sectionData.detected.slice(0, 3).map((pattern: string, i: number) => (
                                    <div key={i} className="flex items-center gap-2 font-mono">
                                      <span className="text-green-600">✓</span>
                                      <span>{pattern}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {sectionData.trendAlignment?.suggestions && sectionData.trendAlignment.suggestions.length > 0 && (
                              <div>
                                <div className="text-xs font-semibold mb-1 font-mono">Suggestions:</div>
                                <div className="text-xs space-y-1">
                                  {sectionData.trendAlignment.suggestions.slice(0, 2).map((suggestion: string, i: number) => (
                                    <div key={i} className="flex items-start gap-2 font-mono">
                                      <span className="text-blue-600 mt-0.5">•</span>
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
                            <div className="text-xs font-semibold mb-1 font-mono">Scan Pattern:</div>
                            <div className="text-xs mb-2 font-mono">
                              {sectionData.scanPattern || 'Unknown'}
                            </div>
                            
                            {sectionData.focalPoints && sectionData.focalPoints.length > 0 && (
                              <div className="mb-2">
                                <div className="text-xs font-semibold mb-1 font-mono">Focal Points:</div>
                                <div className="text-xs space-y-1">
                                  {sectionData.focalPoints.slice(0, 3).map((point: any, i: number) => (
                                    <div key={i} className="flex justify-between font-mono">
                                      <span>{point.element}</span>
                                      <span className="text-orange-600">Weight: {point.weight}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {sectionData.improvements && sectionData.improvements.length > 0 && (
                              <div>
                                <div className="text-xs font-semibold mb-1 font-mono">Improvements:</div>
                                <div className="text-xs space-y-1">
                                  {sectionData.improvements.slice(0, 2).map((improvement: any, i: number) => (
                                    <div key={i} className="flex items-start gap-2 font-mono">
                                      <span className="text-green-600 mt-0.5">→</span>
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


    </motion.div>
  );
} 