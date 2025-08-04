'use client';

import React, { useState, useEffect } from 'react';
import { DarkPattern } from '@/types/analysis';

interface EthicsScoreProps {
  userId: string;
  latestDarkPatterns?: DarkPattern[];
  latestFeedbackId?: string;
  onScoreUpdate?: (score: number) => void;
  onShowDarkPatterns?: () => void;
  feedback?: any[];
}

interface UploadHistory {
  hadDarkPatterns: boolean;
  patterns: DarkPattern[];
  timestamp: Date;
  uploadId?: string;
}

export default function EthicsScore({ userId, latestDarkPatterns, latestFeedbackId, onScoreUpdate, onShowDarkPatterns, feedback = [] }: EthicsScoreProps) {
  const [score, setScore] = useState(100);
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [hovering, setHovering] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);

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
    if (latestDarkPatterns !== undefined && latestFeedbackId) {
      // Check if we've already processed this upload
      const alreadyProcessed = uploadHistory.some(upload => upload.uploadId === latestFeedbackId);
      if (!alreadyProcessed) {
        processNewUpload(latestDarkPatterns, latestFeedbackId);
      }
    }
  }, [latestDarkPatterns, latestFeedbackId, uploadHistory]);

  // Glitch effect timer
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 300);
    }, 7000);

    return () => clearInterval(glitchInterval);
  }, []);

  const processNewUpload = (patterns: DarkPattern[], uploadId: string) => {
    const newUpload: UploadHistory = {
      hadDarkPatterns: patterns.length > 0,
      patterns: patterns,
      timestamp: new Date(),
      uploadId: uploadId
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
    if (score >= 80) return 'bg-green-600';
    if (score >= 50) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const getTooltipMessage = () => {
    if (score >= 90) return "Your designs are ethically pristine.";
    if (score >= 70) return "Minor ethical concerns detected.";
    if (score >= 50) return "You're toeing the ethical line.";
    return "Dark patterns are consuming your soul.";
  };

  const getEthicsTitle = () => {
    if (score >= 99) return "Pattern Prophet";
    if (score >= 93) return "UX Saint";
    if (score >= 87) return "Interface Ally";
    if (score >= 80) return "Design Steward";
    if (score >= 70) return "UX Acolyte";
    if (score >= 65) return "Dark Dabbler";
    if (score >= 55) return "Metrics Minion";
    if (score >= 45) return "Pattern Parasite";
    if (score >= 35) return "Conversion Goblin";
    if (score >= 25) return "UX Sinner";
    return "Lost Soul";
  };

  const glitchText = (text: string) => {
    const glitchChars = '!@#$%^&*()_+{}|:"<>?[]\\;\',./-=`~';
    return text.split('').map((char, i) => {
      if (Math.random() < 0.3) {
        return glitchChars[Math.floor(Math.random() * glitchChars.length)];
      }
      return char;
    }).join('');
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
      className="bg-[#f5f1e6] p-4 border-2 border-black/70 cursor-pointer group h-full"
      onClick={onShowDarkPatterns}
    >
      <div className="text-xs text-black/60 mb-1 font-mono">[ETHICS_SCORE]</div>
      <div className="text-5xl font-bold font-mono mb-1">{score.toString().padStart(3, '0')}</div>
      
      <div className={`w-full text-center text-xs font-bold text-white mb-2 py-1 transition-all duration-75 ${
        isGlitching 
          ? 'bg-red-600 animate-pulse' 
          : 'bg-black/80'
      }`}>
        {isGlitching ? glitchText(getEthicsTitle()) : getEthicsTitle()}
      </div>
      
      {/* Blocky CRT terminal progress bar */}
      <div className="mb-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1 flex-1">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i}
                className={`h-3 flex-1 ${
                  i < Math.floor(score / 5) 
                    ? 'bg-green-500'
                    : 'bg-black/20'
                }`}
              />
            ))}
          </div>
          <div className="text-xs text-black/60 font-mono">{score}%</div>
        </div>
      </div>
      
      <div className="text-xs text-black/60">
        └ {uploadsWithDarkPatterns} with dark patterns
      </div>
    </div>
  );
}