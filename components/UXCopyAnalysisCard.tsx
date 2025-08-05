'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { EnhancedUXCopyAnalysis, ZombifyAnalysis } from '@/types/analysis';
import { getUXCopyIssues, shouldShowModule, getModuleConfidence } from '@/utils/analysisCompatibility';

interface UXCopyAnalysisCardProps {
  uxCopy?: EnhancedUXCopyAnalysis;
  analysis?: ZombifyAnalysis; // Add full analysis for compatibility checking
}

export default function UXCopyAnalysisCard({ uxCopy, analysis }: UXCopyAnalysisCardProps) {
  const [activeIssueFilter, setActiveIssueFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  
  // Handle compatibility - get UX copy data from either new or old structure
  const copyData = uxCopy || (analysis as any)?.uxCopyAnalysis || (analysis as any)?.uxCopyInsights;
  
  // Check if module should be shown based on strength
  const moduleStrength = analysis?.moduleStrength?.uxCopyInsights || 0;
  const isWeak = analysis && !shouldShowModule('uxCopyInsights', analysis);
  
  if (isWeak) {
    return (
      <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg opacity-75">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <span>✏️</span>
          <h3 className="font-medium font-mono tracking-wider">UX COPY ANALYSIS</h3>
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-mono">
            Low Confidence
          </span>
        </div>
        <p className="text-sm text-gray-400 font-mono">
          Not enough signal to analyze UX copy effectively. Try uploading an interface with more text content.
        </p>
      </div>
    );
  }
  
  // Early return if no copy data
  if (!copyData) {
    return null;
  }
  
  // Get module confidence for display
  const confidence = analysis ? getModuleConfidence('uxCopyInsights', analysis) : 'medium';

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-200';
      case 'MEDIUM': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'LOW': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getArchetypeIcon = (archetype: string) => {
    const archetypes: { [key: string]: string } = {
      'Hero': '🦸',
      'Expert': '🎓',
      'Caregiver': '🤗',
      'Explorer': '🗺️',
      'Rebel': '⚡',
      'Lover': '💖',
      'Creator': '🎨',
      'Jester': '🎭',
      'Sage': '🧙',
      'Innocent': '🌟',
      'Ruler': '👑',
      'Magician': '✨'
    };
    return archetypes[archetype] || '📝';
  };

  const filteredIssues = activeIssueFilter === 'ALL' 
    ? (copyData.issues || []) 
    : (copyData.issues || []).filter((issue: any) => issue.severity === activeIssueFilter);

  return (
    <div className="space-y-4">
      {/* Main Score Card */}
      <motion.div 
        className="border-2 border-black bg-[#f5f1e6] p-4 relative overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Low Confidence Label */}
        {confidence === 'low' && (
          <span className="absolute top-2 right-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-mono">
            Low Confidence
          </span>
        )}
        <div className="text-center">
          <div className="text-lg font-bold mb-2 font-mono tracking-wider">
            UX COPY INTELLIGENCE
          </div>
          <motion.div 
            className={`text-3xl font-bold mb-2 ${getScoreColor(copyData.score || 0)} font-mono`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            {copyData.score || 0}
            <span className="text-lg opacity-60">/100</span>
          </motion.div>
          {analysis && (
            <div className={`text-xs font-mono ${
              confidence === 'high' ? 'text-green-600' :
              confidence === 'medium' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              Confidence: {confidence.toUpperCase()}
            </div>
          )}
          <div className="text-xs opacity-60 font-mono">Copy effectiveness & audience alignment</div>
        </div>
      </motion.div>

      {/* Audience Alignment Card */}
      <motion.div
        className="bg-white border-2 border-black overflow-hidden shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">{getArchetypeIcon(copyData.audienceAlignment?.brandArchetype || 'Unknown')}</span>
          <div className="font-semibold text-sm font-mono tracking-wider">AUDIENCE ALIGNMENT</div>
          <div className={`ml-auto text-xs font-bold ${getScoreColor(100 - (copyData.audienceAlignment?.toneMismatch || 50))} font-mono`}>
            {100 - (copyData.audienceAlignment?.toneMismatch || 50)}% match
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div>
            <span className="font-semibold opacity-70">Target:</span> {copyData.audienceAlignment?.detectedAudience || 'Unknown'}
          </div>
          <div>
            <span className="font-semibold opacity-70">Style:</span> {copyData.audienceAlignment?.copyStyle || 'Unknown'}
          </div>
          <div>
            <span className="font-semibold opacity-70">Archetype:</span> {copyData.audienceAlignment?.brandArchetype || 'Unknown'}
          </div>
          <div>
            <span className="font-semibold opacity-70">Alignment:</span> {100 - (copyData.audienceAlignment?.toneMismatch || 50)}% match
          </div>
        </div>
      </motion.div>

      {/* Copy Issues Card */}
      <motion.div
        className="bg-white border-2 border-black overflow-hidden shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">⚠️</span>
          <div className="font-semibold text-sm font-mono tracking-wider">COPY ISSUES</div>
          <div className="ml-auto text-xs font-bold text-red-600 font-mono">
            {(copyData.issues || []).filter((i: any) => i.severity === 'HIGH').length} HIGH
          </div>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex gap-1 mb-3">
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveIssueFilter(filter as any)}
              className={`text-xs px-2 py-1 font-mono border ${
                activeIssueFilter === filter
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-black/20 hover:border-black'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Issues List */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {filteredIssues.slice(0, 5).map((issue, i) => (
            <div key={i} className="text-xs border border-black/20 p-2 bg-white rounded">
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold">{issue.element}</span>
                <span className={`px-1 py-0.5 text-xs font-mono border ${getSeverityColor(issue.severity)}`}>
                  {issue.severity}
                </span>
              </div>
              <div className="text-black/70 mb-1">{issue.issue}</div>
              <div className="text-green-700 text-xs">
                💡 {issue.suggested[0]}
              </div>
            </div>
          ))}
          {filteredIssues.length > 5 && (
            <div className="text-xs opacity-60 font-mono text-center">
              +{filteredIssues.length - 5} more issues
            </div>
          )}
        </div>
      </motion.div>

      {/* Microcopy Opportunities Card */}
      <motion.div
        className="bg-white border-2 border-black overflow-hidden shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">✨</span>
          <div className="font-semibold text-sm font-mono tracking-wider">MICROCOPY OPPORTUNITIES</div>
          <div className="ml-auto text-xs font-bold text-blue-600 font-mono">
            {(copyData.microCopyOpportunities || []).length}
          </div>
        </div>
        
        <div className="space-y-2">
          {(copyData.microCopyOpportunities || []).slice(0, 3).map((opp: any, i: number) => (
            <div key={i} className="text-xs border border-black/20 p-2 bg-white rounded">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-1 py-0.5 bg-blue-100 text-blue-800 font-mono text-xs">
                  {opp.type.replace(/_/g, ' ')}
                </span>
                <span className="text-black/60">{opp.location}</span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                <div>
                  <span className="text-red-600 font-semibold">Current:</span> &quot;{opp.current}&quot;
                </div>
                <div>
                  <span className="text-green-600 font-semibold">Improved:</span> &quot;{opp.improved}&quot;
                </div>
              </div>
              <div className="text-black/60 mt-1 text-xs">
                {opp.reasoning}
              </div>
            </div>
          ))}
          {(copyData.microCopyOpportunities || []).length > 3 && (
            <div className="text-xs opacity-60 font-mono text-center">
              +{(copyData.microCopyOpportunities || []).length - 3} more opportunities
            </div>
          )}
        </div>
      </motion.div>

      {/* Writing Tone Card */}
      <motion.div
        className="bg-white border-2 border-black overflow-hidden shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">🎭</span>
          <div className="font-semibold text-sm font-mono tracking-wider">WRITING TONE</div>
        </div>
        
        <div className="grid grid-cols-1 gap-2 text-xs font-mono">
          <div className="bg-white border p-2 rounded">
            <div className="font-semibold text-gray-600 mb-1">Current Tone:</div>
            <div className="text-black">{copyData.writingTone?.current || 'Not analyzed'}</div>
          </div>
          <div className="bg-white border p-2 rounded">
            <div className="font-semibold text-green-600 mb-1">Recommended:</div>
            <div className="text-black">{copyData.writingTone?.recommended || 'Not available'}</div>
          </div>
          <div className="bg-white border p-2 rounded">
            <div className="font-semibold text-blue-600 mb-1">Example:</div>
            <div className="text-black italic">&quot;{copyData.writingTone?.example || 'Not available'}&quot;</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}