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
        className="border-2 border-black bg-[#f5f1e6] relative overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-lg font-bold font-mono tracking-wider">
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
            <div className="text-sm opacity-60 font-mono">User engagement potential</div>
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
            <span className="opacity-60 font-mono">Status: </span>
            <span className={score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'}>
              {score >= 80 ? 'High Engagement' : score >= 60 ? 'Moderate Engagement' : 'Low Engagement'}
            </span>
          </div>
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

  const categories = [
    { key: 'firstImpression', label: 'First Impression', icon: '👁️' },
    { key: 'usability', label: 'Usability', icon: '🔧' },
    { key: 'trustworthiness', label: 'Trustworthiness', icon: '🛡️' },
    { key: 'conversion', label: 'Conversion', icon: '🎯' },
    { key: 'accessibility', label: 'Accessibility', icon: '♿' }
  ];

  return (
    <motion.div 
      className="border-2 border-black bg-[#f5f1e6] relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Grip Score Display - Left Side */}
          <motion.div 
            className="lg:col-span-1 text-center lg:text-left"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-lg font-bold mb-4 opacity-70 font-mono tracking-wider">
              GRIP SCORE ANALYSIS
            </div>
            
            {/* Main Score Display */}
            <div className="mb-4">
              <motion.div 
                className={`text-6xl lg:text-7xl font-bold mb-4 ${getScoreColor(overallScore)}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                {overallScore}
                <span className="text-2xl lg:text-3xl opacity-60">/100</span>
              </motion.div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <motion.div
                  className={`h-3 rounded-full ${getScoreColor(overallScore).replace('text-', 'bg-')}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${overallScore}%` }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                />
              </div>
              
              <div className={`text-sm font-semibold mb-2 ${getScoreColor(overallScore)} font-mono`}>
                {overallScore >= 80 ? 'High Engagement' : overallScore >= 60 ? 'Moderate Engagement' : 'Low Engagement'}
              </div>
              
              <div className="text-xs opacity-60 font-mono">
                User engagement potential
              </div>
            </div>
          </motion.div>

          {/* Category Breakdown - Right Side */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {showBreakdown && breakdown && (
              <>
                <div className="text-lg font-bold mb-4 opacity-70 font-mono tracking-wider">CATEGORY BREAKDOWN</div>
                
                <div className="space-y-2">
                  {categories.map((category, index) => {
                    const categoryData = breakdown[category.key as keyof typeof breakdown];
                    if (!categoryData) return null;

                    return (
                      <motion.div
                        key={category.key}
                        className="border-2 border-black bg-white p-3 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] relative hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{category.icon}</span>
                            <div className="text-xs font-mono font-bold tracking-wider">{category.label}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`text-sm font-bold ${getScoreColor(categoryData.score)} font-mono`}>
                              {categoryData.score}
                            </div>
                            <div className={`w-2 h-2 border border-black ${getScoreColor(categoryData.score).replace('text-', 'bg-')}`}></div>
                          </div>
                        </div>

                        {/* Mini progress bar for each category */}
                        <div className="w-full bg-gray-200 rounded-full h-1 mb-2">
                          <motion.div
                            className={`h-1 rounded-full ${getScoreColor(categoryData.score).replace('text-', 'bg-')}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${categoryData.score}%` }}
                            transition={{ duration: 1, delay: 0.6 + index * 0.1 }}
                          />
                        </div>

                        {/* Compact content without headings */}
                        <div className="border-t border-black/20 bg-black/5 -mx-3 px-3 pt-2">
                          <div className="text-xs mb-2 opacity-80 leading-tight font-mono">{categoryData.reasoning}</div>
                          
                          {categoryData.evidence && categoryData.evidence.length > 0 && (
                            <ul className="text-xs space-y-1">
                              {categoryData.evidence.slice(0, 2).map((evidence, i) => (
                                <motion.li 
                                  key={i} 
                                  className="flex items-start gap-1 opacity-70"
                                  initial={{ opacity: 0, x: -5 }}
                                  animate={{ opacity: 0.7, x: 0 }}
                                  transition={{ delay: 0.7 + index * 0.05 + i * 0.05 }}
                                >
                                  <span className="text-blue-600 mt-0.5 text-xs">•</span>
                                  <span className="leading-tight font-mono">{evidence}</span>
                                </motion.li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}