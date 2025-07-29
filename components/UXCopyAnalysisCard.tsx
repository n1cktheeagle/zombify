'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { EnhancedUXCopyAnalysis } from '@/types/analysis';
import GlitchText from './GlitchText';

interface UXCopyAnalysisCardProps {
  uxCopy: EnhancedUXCopyAnalysis;
}

export default function UXCopyAnalysisCard({ uxCopy }: UXCopyAnalysisCardProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activeIssueFilter, setActiveIssueFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

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
    ? uxCopy.issues 
    : uxCopy.issues.filter(issue => issue.severity === activeIssueFilter);

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
          UX COPY INTELLIGENCE
        </div>
        <motion.div 
          className={`text-3xl font-bold mb-2 ${getScoreColor(uxCopy.score)} font-mono`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          {uxCopy.score}
          <span className="text-lg opacity-60">/100</span>
        </motion.div>
        <div className="text-xs opacity-60 font-mono">Copy effectiveness & audience alignment</div>
      </div>

      {/* Audience Alignment Section */}
      <motion.div
        className="bg-white border-2 border-black overflow-hidden shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setExpandedSection(expandedSection === 'audience' ? null : 'audience')}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm">{getArchetypeIcon(uxCopy.audienceAlignment.brandArchetype)}</span>
              <div>
                <div className="font-semibold text-xs font-mono tracking-wider">AUDIENCE ALIGNMENT</div>
                <div className="text-xs opacity-70">
                  {uxCopy.audienceAlignment.detectedAudience} • {uxCopy.audienceAlignment.brandArchetype}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`text-xs font-bold ${getScoreColor(uxCopy.audienceAlignment.toneMismatch)} font-mono`}>
                {uxCopy.audienceAlignment.toneMismatch}%
              </div>
              <motion.div
                animate={{ rotate: expandedSection === 'audience' ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-gray-400"
              >
                ▼
              </motion.div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {expandedSection === 'audience' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 border-t border-black/20 bg-black/5">
                <div className="mt-2 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="font-semibold opacity-70">Target:</span> {uxCopy.audienceAlignment.detectedAudience}
                    </div>
                    <div>
                      <span className="font-semibold opacity-70">Style:</span> {uxCopy.audienceAlignment.copyStyle}
                    </div>
                    <div>
                      <span className="font-semibold opacity-70">Archetype:</span> {uxCopy.audienceAlignment.brandArchetype}
                    </div>
                    <div>
                      <span className="font-semibold opacity-70">Alignment:</span> {uxCopy.audienceAlignment.toneMismatch}% match
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Copy Issues Section */}
      <motion.div
        className="bg-white border-2 border-black overflow-hidden shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div
          className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setExpandedSection(expandedSection === 'issues' ? null : 'issues')}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm">⚠️</span>
              <div>
                <div className="font-semibold text-xs font-mono tracking-wider">COPY ISSUES</div>
                <div className="text-xs opacity-70">
                  {uxCopy.issues.length} issues detected
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs font-bold text-red-600 font-mono">
                {uxCopy.issues.filter(i => i.severity === 'HIGH').length} HIGH
              </div>
              <motion.div
                animate={{ rotate: expandedSection === 'issues' ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-gray-400"
              >
                ▼
              </motion.div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {expandedSection === 'issues' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 border-t border-black/20 bg-black/5">
                <div className="mt-2 space-y-2">
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
                  <div className="space-y-2 max-h-40 overflow-y-auto">
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
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Microcopy Opportunities */}
      <motion.div
        className="bg-white border-2 border-black overflow-hidden shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <motion.div
          className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setExpandedSection(expandedSection === 'microcopy' ? null : 'microcopy')}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm">✨</span>
              <div>
                <div className="font-semibold text-xs font-mono tracking-wider">MICROCOPY OPPORTUNITIES</div>
                <div className="text-xs opacity-70">
                  {uxCopy.microCopyOpportunities.length} optimization chances
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs font-bold text-blue-600 font-mono">
                {uxCopy.microCopyOpportunities.length}
              </div>
              <motion.div
                animate={{ rotate: expandedSection === 'microcopy' ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-gray-400"
              >
                ▼
              </motion.div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {expandedSection === 'microcopy' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 border-t border-black/20 bg-black/5">
                <div className="mt-2 space-y-2">
                  {uxCopy.microCopyOpportunities.slice(0, 3).map((opp, i) => (
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
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Writing Tone */}
      <motion.div
        className="bg-white border-2 border-black overflow-hidden shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setExpandedSection(expandedSection === 'tone' ? null : 'tone')}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm">🎭</span>
              <div>
                <div className="font-semibold text-xs font-mono tracking-wider">WRITING TONE</div>
                <div className="text-xs opacity-70">
                  {uxCopy.writingTone.current} → {uxCopy.writingTone.recommended}
                </div>
              </div>
            </div>
            <motion.div
              animate={{ rotate: expandedSection === 'tone' ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-gray-400"
            >
              ▼
            </motion.div>
          </div>
        </motion.div>

        <AnimatePresence>
          {expandedSection === 'tone' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 border-t border-black/20 bg-black/5">
                <div className="mt-2 space-y-2">
                  <div className="grid grid-cols-1 gap-2 text-xs font-mono">
                    <div className="bg-white border p-2 rounded">
                      <div className="font-semibold text-gray-600 mb-1">Current Tone:</div>
                      <div className="text-black">{uxCopy.writingTone.current}</div>
                    </div>
                    <div className="bg-white border p-2 rounded">
                      <div className="font-semibold text-green-600 mb-1">Recommended:</div>
                      <div className="text-black">{uxCopy.writingTone.recommended}</div>
                    </div>
                    <div className="bg-white border p-2 rounded">
                      <div className="font-semibold text-blue-600 mb-1">Example:</div>
                      <div className="text-black italic">&quot;{uxCopy.writingTone.example}&quot;</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}