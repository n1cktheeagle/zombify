'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExtractedData } from '@/lib/extractors/browserExtractor';

interface ExtractedDataDisplayProps {
  extractedData?: ExtractedData;
  className?: string;
}

export default function ExtractedDataDisplay({ extractedData, className = '' }: ExtractedDataDisplayProps) {
  const [activeTab, setActiveTab] = useState<'colors' | 'text' | 'contrast' | 'spacing' | 'metadata'>('colors');
  
  if (!extractedData) return null;

  const tabs = [
    { id: 'colors', label: '🎨 Colors', count: extractedData.colors.palette.length },
    { id: 'text', label: '📝 Text', count: extractedData.text.blocks.length },
    { id: 'contrast', label: '⚡ Contrast', count: extractedData.contrast.issues.length },
    { id: 'spacing', label: '📏 Spacing', count: null },
    { id: 'metadata', label: '📊 Metadata', count: null },
  ];

  return (
    <motion.div 
      className={`bg-white border-2 border-black p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold font-mono text-lg tracking-wider">EXTRACTED DATA (REAL)</h3>
        <span className="text-xs font-mono bg-green-100 text-green-800 px-2 py-1 rounded">
          NO HALLUCINATIONS
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1 text-xs font-mono border-2 transition-all ${
              activeTab === tab.id 
                ? 'bg-black text-white border-black' 
                : 'bg-white text-black border-gray-300 hover:border-black'
            }`}
          >
            {tab.label}
            {tab.count !== null && (
              <span className="ml-1 opacity-60">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Colors Tab */}
          {activeTab === 'colors' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>Primary: <span className="font-bold">{extractedData.colors.primary}</span></div>
                <div>Secondary: <span className="font-bold">{extractedData.colors.secondary}</span></div>
                <div>Background: <span className="font-bold">{extractedData.colors.background}</span></div>
                <div>Text: <span className="font-bold">{extractedData.colors.text[0] || 'N/A'}</span></div>
              </div>
              
              <div>
                <div className="text-xs font-mono font-semibold mb-2">Full Palette ({extractedData.colors.palette.length} colors)</div>
                <div className="flex flex-wrap gap-2">
                  {extractedData.colors.palette.slice(0, 12).map((color, i) => (
                    <div key={i} className="text-center">
                      <div 
                        className="w-10 h-10 border-2 border-black rounded"
                        style={{ backgroundColor: color.hex }}
                        title={`Frequency: ${color.frequency}`}
                      />
                      <div className="text-xs font-mono mt-1">{color.hex}</div>
                      <div className="text-xs opacity-60">L: {color.luminance.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Text Tab */}
          {activeTab === 'text' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs font-mono font-semibold">OCR RESULTS</div>
                <div className="text-xs font-mono text-blue-600">
                  {extractedData.text.confidence}% confidence
                </div>
              </div>
              
              {/* Full extracted text */}
              <div className="p-2 bg-gray-50 border border-gray-200 rounded max-h-40 overflow-y-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {extractedData.text.extracted || 'No text detected'}
                </pre>
              </div>

              {/* Text blocks with locations */}
              {extractedData.text.blocks.length > 0 && (
                <div>
                  <div className="text-xs font-mono font-semibold mb-2">Text Blocks ({extractedData.text.blocks.length})</div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {extractedData.text.blocks.map((block, i) => (
                      <div key={i} className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                        <div className="font-mono mb-1">{block.text}</div>
                        <div className="flex gap-4 text-xs opacity-60">
                          <span>Confidence: {block.confidence}%</span>
                          {block.location && (
                            <span>Position: ({block.location.x}, {block.location.y})</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contrast Tab */}
          {activeTab === 'contrast' && (
            <div className="space-y-3">
              {/* Issues */}
              <div>
                <div className="text-xs font-mono font-semibold mb-2 text-red-600">
                  WCAG Failures ({extractedData.contrast.issues.length})
                </div>
                {extractedData.contrast.issues.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {extractedData.contrast.issues.map((issue, i) => (
                      <div key={i} className="p-2 bg-red-50 border border-red-200 rounded">
                        <div className="flex justify-between items-start text-xs font-mono">
                          <span>{issue.location}</span>
                          <span className="font-bold">{issue.ratio}:1</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div 
                            className="w-8 h-4 border border-black"
                            style={{ backgroundColor: issue.foreground }}
                            title={issue.foreground}
                          />
                          <span className="text-xs">on</span>
                          <div 
                            className="w-8 h-4 border border-black"
                            style={{ backgroundColor: issue.background }}
                            title={issue.background}
                          />
                          <span className={`text-xs font-mono ml-2 px-1 rounded ${
                            issue.wcagLevel === 'FAIL' ? 'bg-red-600 text-white' :
                            issue.wcagLevel === 'AA' ? 'bg-yellow-600 text-white' :
                            'bg-green-600 text-white'
                          }`}>
                            {issue.wcagLevel}
                          </span>
                          <span className={`text-xs ${
                            issue.severity === 'HIGH' ? 'text-red-600' :
                            issue.severity === 'MEDIUM' ? 'text-yellow-600' :
                            'text-gray-600'
                          }`}>
                            {issue.severity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">No contrast issues detected</div>
                )}
              </div>

              {/* Passes */}
              {extractedData.contrast.passes.length > 0 && (
                <div>
                  <div className="text-xs font-mono font-semibold mb-2 text-green-600">
                    WCAG Passes ({extractedData.contrast.passes.length})
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {extractedData.contrast.passes.slice(0, 5).map((pass, i) => (
                      <div key={i} className="p-1 bg-green-50 border border-green-200 rounded text-xs font-mono">
                        <span>{pass.location}:</span>
                        <span className="ml-2 font-bold">{pass.ratio}:1</span>
                        <span className="ml-2 text-green-600">{pass.wcagLevel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Spacing Tab */}
          {activeTab === 'spacing' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="opacity-60">Average Padding</div>
                  <div className="text-lg font-bold">{extractedData.spacing.avgPadding}px</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="opacity-60">Consistency</div>
                  <div className="text-lg font-bold">{extractedData.spacing.consistency}%</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-xs font-mono">Grid Alignment</span>
                <span className={`text-xs font-mono font-bold ${
                  extractedData.spacing.gridAlignment ? 'text-green-600' : 'text-red-600'
                }`}>
                  {extractedData.spacing.gridAlignment ? '✓ ALIGNED' : '✗ MISALIGNED'}
                </span>
              </div>

              <div className="text-xs text-gray-600">
                <div className="font-semibold mb-1">Spacing Insights:</div>
                <ul className="space-y-1">
                  {extractedData.spacing.consistency < 50 && (
                    <li>• Inconsistent spacing detected - consider standardizing</li>
                  )}
                  {extractedData.spacing.avgPadding < 8 && (
                    <li>• Very tight padding - may affect readability</li>
                  )}
                  {extractedData.spacing.avgPadding > 32 && (
                    <li>• Large padding detected - check mobile responsiveness</li>
                  )}
                  {!extractedData.spacing.gridAlignment && (
                    <li>• Elements not aligned to grid - consider using consistent grid system</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Metadata Tab */}
          {activeTab === 'metadata' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="opacity-60">Dimensions:</span>
                  <div className="font-bold">
                    {extractedData.metadata.dimensions.width} × {extractedData.metadata.dimensions.height}
                  </div>
                </div>
                <div>
                  <span className="opacity-60">File Size:</span>
                  <div className="font-bold">
                    {(extractedData.metadata.fileSize / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <div>
                  <span className="opacity-60">Aspect Ratio:</span>
                  <div className="font-bold">
                    {(extractedData.metadata.dimensions.width / extractedData.metadata.dimensions.height).toFixed(2)}:1
                  </div>
                </div>
                <div>
                  <span className="opacity-60">Extracted At:</span>
                  <div className="font-bold">
                    {new Date(extractedData.metadata.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Quality Indicators */}
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                <div className="text-xs font-mono font-semibold mb-1">Quality Indicators</div>
                <ul className="text-xs space-y-1">
                  {extractedData.metadata.dimensions.width < 800 && (
                    <li className="text-orange-600">⚠️ Low resolution - may affect OCR accuracy</li>
                  )}
                  {extractedData.metadata.fileSize > 5000000 && (
                    <li className="text-orange-600">⚠️ Large file size - consider optimization</li>
                  )}
                  {extractedData.text.confidence < 70 && (
                    <li className="text-orange-600">⚠️ Low OCR confidence - upload clearer image</li>
                  )}
                  {extractedData.colors.palette.length < 5 && (
                    <li className="text-yellow-600">ℹ️ Limited color palette detected</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}