'use client';

import React, { useState, useEffect } from 'react';
import { DarkPattern } from '@/types/analysis';

interface EthicsScoreProps {
  userId: string;
  latestDarkPatterns?: DarkPattern[];
  onScoreUpdate?: (score: number) => void;
  onShowDarkPatterns?: () => void;
  feedback?: any[];
}

interface UploadHistory {
  hadDarkPatterns: boolean;
  patterns: DarkPattern[];
  timestamp: Date;
}

export default function EthicsScore({ userId, latestDarkPatterns, onScoreUpdate, onShowDarkPatterns, feedback = [] }: EthicsScoreProps) {
  const [score, setScore] = useState(100);
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [hovering, setHovering] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(`ethics_history_${userId}`);
    const savedScore = localStorage.getItem(`ethics_score_${userId}`);
    
    if (savedHistory) {
      setUploadHistory(JSON.parse(savedHistory));
    }
    if (savedScore) {
      setScore(parseInt(savedScore));
    }
  }, [userId]);

  // Process new upload when latestDarkPatterns changes
  useEffect(() => {
    if (latestDarkPatterns !== undefined) {
      processNewUpload(latestDarkPatterns);
    }
  }, [latestDarkPatterns]);

  const processNewUpload = (patterns: DarkPattern[]) => {
    const newUpload: UploadHistory = {
      hadDarkPatterns: patterns.length > 0,
      patterns: patterns,
      timestamp: new Date()
    };

    // Calculate consecutive uploads with dark patterns
    let consecutiveCount = 0;
    for (let i = uploadHistory.length - 1; i >= 0; i--) {
      if (uploadHistory[i].hadDarkPatterns) {
        consecutiveCount++;
      } else {
        break;
      }
    }
    
    // If current upload has dark patterns, add 1 to consecutive count
    if (patterns.length > 0) {
      consecutiveCount++;
    }

    // Calculate penalty
    let penalty = 0;
    patterns.forEach(pattern => {
      let basePenalty = 0;
      switch (pattern.severity) {
        case 'LOW':
          basePenalty = 2;
          break;
        case 'MEDIUM':
          basePenalty = 5;
          break;
        case 'HIGH':
          basePenalty = 10;
          break;
      }
      
      // Apply multiplier based on consecutive uploads
      const multiplier = Math.min(consecutiveCount, 3); // Max multiplier is 3
      penalty += basePenalty * multiplier;
    });

    // Calculate new score
    let newScore = score;
    if (patterns.length === 0) {
      // No dark patterns - add 2 points (max 100)
      newScore = Math.min(100, score + 2);
    } else {
      // Dark patterns detected - subtract penalty
      newScore = Math.max(0, score - penalty);
    }

    // Update state and localStorage
    const newHistory = [...uploadHistory, newUpload];
    setScore(newScore);
    setUploadHistory(newHistory);
    
    localStorage.setItem(`ethics_history_${userId}`, JSON.stringify(newHistory));
    localStorage.setItem(`ethics_score_${userId}`, newScore.toString());
    
    if (onScoreUpdate) {
      onScoreUpdate(newScore);
    }
  };

  const getBarColor = () => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTooltipMessage = () => {
    if (score >= 90) return "Your designs are ethically pristine.";
    if (score >= 70) return "Minor ethical concerns detected.";
    if (score >= 50) return "You're toeing the ethical line.";
    return "Dark patterns are consuming your soul.";
  };

  // Count uploads with dark patterns
  const uploadsWithDarkPatterns = feedback.filter(item => {
    if (item.analysis && typeof item.analysis === 'object' && 'darkPatterns' in item.analysis) {
      return item.analysis.darkPatterns && item.analysis.darkPatterns.length > 0;
    }
    return false;
  }).length;

  return (
    <div 
      className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all min-w-[280px]"
      onClick={onShowDarkPatterns}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 font-mono text-base font-bold">
          <span>🧭</span>
          <span>Ethics Score</span>
        </div>
        <div className="text-2xl font-bold">{score}/100</div>
      </div>
      
      <div 
        className="relative w-full"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* Progress bar background */}
        <div className="w-full h-3 bg-gray-200 border border-black overflow-hidden">
          {/* Progress bar fill */}
          <div 
            className={`h-full transition-all duration-500 ${getBarColor()}`}
            style={{ width: `${score}%` }}
          />
        </div>
        
        {/* Tooltip */}
        {hovering && (
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white px-3 py-2 text-xs font-mono whitespace-nowrap z-10 rounded">
            {getTooltipMessage()}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-black" />
          </div>
        )}
      </div>
      
      {/* Click indicator */}
      <div className="text-xs opacity-60 mt-2 text-center">
        {uploadsWithDarkPatterns > 0 
          ? `View ${uploadsWithDarkPatterns} upload${uploadsWithDarkPatterns !== 1 ? 's' : ''} with dark patterns`
          : 'No dark patterns detected'
        }
      </div>
    </div>
  );
}