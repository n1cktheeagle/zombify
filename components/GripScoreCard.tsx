'use client';

import { GripScore } from '@/types/analysis';

type LegacyGripScoreCardProps = {
  score: number;
};

type NewGripScoreCardProps = {
  gripScore: GripScore;
  showBreakdown?: boolean;
};

type GripScoreCardProps = LegacyGripScoreCardProps | NewGripScoreCardProps;

// Type guard
function isNewFormat(props: GripScoreCardProps): props is NewGripScoreCardProps {
  return 'gripScore' in props;
}

export default function GripScoreCard(props: GripScoreCardProps) {
  // Handle legacy format
  if (!isNewFormat(props)) {
    return (
      <div className="rounded-2xl shadow p-4 border bg-white">
        <h2 className="text-lg font-semibold">Grip Score</h2>
        <div className="text-4xl font-bold mt-2">{props.score}/100</div>
      </div>
    );
  }

  // Handle new format
  const { gripScore, showBreakdown = false } = props;
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="rounded-2xl shadow p-4 border bg-white">
      <h2 className="text-lg font-semibold">Grip Score</h2>
      <div className={`text-4xl font-bold mt-2 ${getScoreColor(gripScore.overall)}`}>
        {gripScore.overall}/100
      </div>
      
      {showBreakdown && (
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>First Impression:</span>
            <span className={`font-semibold ${getScoreColor(gripScore.breakdown.firstImpression)}`}>
              {gripScore.breakdown.firstImpression}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Usability:</span>
            <span className={`font-semibold ${getScoreColor(gripScore.breakdown.usability)}`}>
              {gripScore.breakdown.usability}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Trust:</span>
            <span className={`font-semibold ${getScoreColor(gripScore.breakdown.trustworthiness)}`}>
              {gripScore.breakdown.trustworthiness}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Conversion:</span>
            <span className={`font-semibold ${getScoreColor(gripScore.breakdown.conversion)}`}>
              {gripScore.breakdown.conversion}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Accessibility:</span>
            <span className={`font-semibold ${getScoreColor(gripScore.breakdown.accessibility)}`}>
              {gripScore.breakdown.accessibility}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}