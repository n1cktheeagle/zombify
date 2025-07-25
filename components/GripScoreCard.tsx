'use client';

import { motion } from 'framer-motion';
import { ZombifyAnalysis } from '@/types/analysis';

interface GripScoreCardProps {
  gripScore?: ZombifyAnalysis['gripScore'];
  score?: number; // Legacy support
  showBreakdown?: boolean;
}

export default function GripScoreCard({ gripScore, score, showBreakdown = false }: GripScoreCardProps) {
  // Handle legacy format
  if (!gripScore && score !== undefined) {
    return (
      <motion.div 
        className="zombify-card p-6 relative overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-lg font-bold mb-2">
            GRIP SCORE
          </div>
          <motion.div 
            className={`text-4xl font-bold mb-2 ${
              score >= 80 ? 'text-green-600' : 
              score >= 60 ? 'text-yellow-600' : 
              'text-red-600'
            }`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            {score}
            <span className="text-lg opacity-60">/100</span>
          </motion.div>
          <div className="text-sm opacity-60">User engagement potential</div>
        </div>

        {/* Simple progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <motion.div
            className={`h-3 rounded-full ${
              score >= 80 ? 'bg-green-600' : 
              score >= 60 ? 'bg-yellow-600' : 
              'bg-red-600'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1.5, delay: 0.5 }}
          />
        </div>

        {/* Status */}
        <div className="text-center text-sm">
          <span className="opacity-60">Status: </span>
          <span className={score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'}>
            {score >= 80 ? 'High Engagement' : score >= 60 ? 'Moderate Engagement' : 'Low Engagement'}
          </span>
        </div>


      </motion.div>
    );
  }

  if (!gripScore) return null;

  const overallScore = gripScore.overall;
  const breakdown = gripScore.breakdown;

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

  const categories = [
    { key: 'firstImpression', label: 'First Impression', icon: '👁️', color: 'text-blue-600' },
    { key: 'usability', label: 'Usability', icon: '🔧', color: 'text-purple-600' },
    { key: 'trustworthiness', label: 'Trustworthiness', icon: '🛡️', color: 'text-green-600' },
    { key: 'conversion', label: 'Conversion', icon: '🎯', color: 'text-orange-600' },
    { key: 'accessibility', label: 'Accessibility', icon: '♿', color: 'text-pink-600' }
  ];

  return (
    <motion.div 
      className="zombify-card p-6 relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-lg font-bold mb-2">
          GRIP SCORE ANALYSIS
        </div>
        <motion.div 
          className={`text-4xl font-bold mb-2 ${getScoreColor(overallScore)}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          {overallScore}
          <span className="text-lg opacity-60">/100</span>
        </motion.div>
        <div className="text-sm opacity-60">Overall user engagement potential</div>
      </div>

      {/* Simple progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
        <motion.div
          className={`h-3 rounded-full ${getScoreColor(overallScore).replace('text-', 'bg-')}`}
          initial={{ width: 0 }}
          animate={{ width: `${overallScore}%` }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />
      </div>

      {/* Enhanced breakdown - converted to info cards */}
      {showBreakdown && breakdown && (
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="text-center mb-4">
            <div className="text-sm font-semibold opacity-80">
              Category Breakdown
            </div>
          </div>

          {categories.map((category, index) => {
            const categoryData = breakdown[category.key as keyof typeof breakdown];
            if (!categoryData) return null;

            return (
              <motion.div
                key={category.key}
                className={`border rounded-lg ${getScoreBg(categoryData.score)}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                {/* Header - no longer clickable */}
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{category.icon}</span>
                      <div>
                        <div className="font-semibold text-sm">{category.label}</div>
                        <div className="text-xs opacity-70">
                          {categoryData.score}/100
                        </div>
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${getScoreColor(categoryData.score)}`}>
                      {categoryData.score}
                    </div>
                  </div>

                  {/* Always visible content */}
                  <div className="border-t bg-white/50 -mx-4 px-4 pt-3">
                    <div className="text-sm font-semibold mb-2">Analysis:</div>
                    <div className="text-sm mb-4 opacity-80">{categoryData.reasoning}</div>
                    
                    {categoryData.evidence && categoryData.evidence.length > 0 && (
                      <div>
                        <div className="text-sm font-semibold mb-2">Evidence:</div>
                        <ul className="text-sm space-y-2">
                          {categoryData.evidence.map((evidence, i) => (
                            <motion.li 
                              key={i} 
                              className="flex items-start gap-2 opacity-80"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                            >
                              <span className="text-blue-600 mt-1">•</span>
                              <span>{evidence}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}


    </motion.div>
  );
}