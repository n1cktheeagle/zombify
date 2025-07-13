'use client';

import { ZombifyAnalysis } from '@/types/analysis';

// Keep backward compatibility with old props
type LegacyFeedbackDisplayProps = {
  image_url: string;
  grip_score: number;
  feedback_chunks: { text: string; category: string }[];
};

// New props for comprehensive analysis
type NewFeedbackDisplayProps = {
  analysis: ZombifyAnalysis;
  isLoggedIn?: boolean;
  isPro?: boolean;
};

type FeedbackDisplayProps = LegacyFeedbackDisplayProps | NewFeedbackDisplayProps;

// Type guard to check which props we have
function isNewFormat(props: FeedbackDisplayProps): props is NewFeedbackDisplayProps {
  return 'analysis' in props;
}

export default function FeedbackDisplay(props: FeedbackDisplayProps) {
  // Handle legacy format
  if (!isNewFormat(props)) {
    return (
      <div className="p-8 space-y-6">
        <img src={props.image_url} alt="Uploaded UI" className="w-full max-w-xl rounded" />
        <div className="text-xl font-bold">Grip Score: {props.grip_score}</div>
        <div className="space-y-4">
          {props.feedback_chunks.map((chunk, index) => (
            <div key={index} className="border p-4 rounded">
              <div className="text-sm text-gray-500">{chunk.category}</div>
              <div>{chunk.text}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Handle new comprehensive format
  const { analysis, isLoggedIn = false, isPro = false } = props;

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return 'border-red-500 bg-red-50';
    if (severity >= 3) return 'border-orange-500 bg-orange-50';
    if (severity >= 2) return 'border-yellow-500 bg-yellow-50';
    return 'border-gray-300 bg-gray-50';
  };

  return (
    <div className="space-y-6">
      {/* Critical Issues */}
      {analysis.criticalIssues.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4">CRITICAL ISSUES</h3>
          <div className="space-y-4">
            {analysis.criticalIssues.map((issue, index) => (
              <div key={index} className={`border-2 p-4 rounded ${getSeverityColor(issue.severity)}`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{issue.issue}</h4>
                  <span className="text-xs bg-black text-white px-2 py-1 rounded">
                    SEV {issue.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{issue.impact}</p>
                {issue.location && (
                  <p className="text-xs text-gray-600 mb-2">
                    📍 {issue.location.element} • {issue.location.region}
                  </p>
                )}
                <div className="mt-3 space-y-2">
                  <div className="bg-white/50 p-2 rounded">
                    <p className="text-xs font-semibold">Quick Fix:</p>
                    <p className="text-sm">{issue.fix.immediate}</p>
                  </div>
                  {issue.fix.better && isPro && (
                    <div className="bg-blue-100 p-2 rounded">
                      <p className="text-xs font-semibold">Better Solution:</p>
                      <p className="text-sm">{issue.fix.better}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usability Issues */}
      {analysis.usabilityIssues.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4">USABILITY ISSUES</h3>
          <div className="space-y-4">
            {analysis.usabilityIssues.slice(0, isLoggedIn ? undefined : 2).map((issue, index) => (
              <div key={index} className="border p-4 rounded bg-white">
                <h4 className="font-semibold mb-2">{issue.issue}</h4>
                <p className="text-sm text-gray-700">{issue.impact}</p>
              </div>
            ))}
            {!isLoggedIn && analysis.usabilityIssues.length > 2 && (
              <p className="text-sm text-gray-600 italic">
                + {analysis.usabilityIssues.length - 2} more issues. Sign up to see all.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Opportunities - Pro only */}
      {isPro && analysis.opportunities.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4">GROWTH OPPORTUNITIES</h3>
          <div className="space-y-4">
            {analysis.opportunities.map((opp, index) => (
              <div key={index} className="border border-green-500 bg-green-50 p-4 rounded">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{opp.opportunity}</h4>
                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                    {opp.potentialImpact}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{opp.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Behavioral Insights - Pro only */}
      {isPro && analysis.behavioralInsights.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4">BEHAVIORAL INSIGHTS</h3>
          <div className="space-y-4">
            {analysis.behavioralInsights.map((insight, index) => (
              <div key={index} className="border border-purple-500 bg-purple-50 p-4 rounded">
                <h4 className="font-semibold mb-2">{insight.pattern}</h4>
                <p className="text-sm text-gray-700 mb-2">{insight.observation}</p>
                <p className="text-xs text-gray-600 italic mb-2">
                  Psychology: {insight.psychology}
                </p>
                <div className="bg-purple-100 p-2 rounded">
                  <p className="text-xs font-semibold">Recommendation:</p>
                  <p className="text-sm">{insight.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accessibility Audit */}
      {analysis.accessibilityAudit && (
        <div>
          <h3 className="text-xl font-bold mb-4">ACCESSIBILITY AUDIT</h3>
          <div className="bg-gray-50 p-4 rounded mb-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{analysis.accessibilityAudit.score}</div>
                <div className="text-xs text-gray-600">Score</div>
              </div>
              <div>
                <div className="text-lg font-bold">WCAG {analysis.accessibilityAudit.wcagLevel}</div>
                <div className="text-xs text-gray-600">Level</div>
              </div>
              <div>
                <div className="text-sm font-bold">{analysis.accessibilityAudit.keyboardNav}</div>
                <div className="text-xs text-gray-600">Keyboard Nav</div>
              </div>
            </div>
          </div>
          {analysis.accessibilityAudit.criticalFailures.length > 0 && (
            <div className="space-y-2">
              {analysis.accessibilityAudit.criticalFailures.map((failure, i) => (
                <div key={i} className="border border-red-400 bg-red-50 p-3 rounded">
                  <div className="font-semibold text-sm">{failure.criterion}: {failure.issue}</div>
                  <div className="text-xs text-gray-700 mt-1">{failure.fix}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Implementation Code - Show for critical issues */}
      {isPro && analysis.criticalIssues.some(issue => issue.fix.implementation) && (
        <div>
          <h3 className="text-xl font-bold mb-4">IMPLEMENTATION CODE</h3>
          <div className="space-y-4">
            {analysis.criticalIssues.filter(issue => issue.fix.implementation).map((issue, index) => (
              <div key={index} className="bg-black text-white p-4 rounded">
                <h4 className="font-semibold mb-2 text-yellow-400">{issue.issue}</h4>
                <pre className="text-xs overflow-x-auto">
                  <code>{issue.fix.implementation}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitive Analysis */}
      {isPro && analysis.competitiveAnalysis && (
        <div>
          <h3 className="text-xl font-bold mb-4">COMPETITIVE ANALYSIS</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Strengths</h4>
              <ul className="list-disc list-inside text-sm">
                {analysis.competitiveAnalysis.strengths.map((strength, i) => (
                  <li key={i}>{strength}</li>
                ))}
              </ul>
            </div>
            <div className="bg-red-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Weaknesses</h4>
              <ul className="list-disc list-inside text-sm">
                {analysis.competitiveAnalysis.weaknesses.map((weakness, i) => (
                  <li key={i}>{weakness}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <h4 className="font-semibold mb-2">Industry Benchmarks</h4>
            <div className="space-y-1 text-sm">
              <div>Industry Average: {analysis.competitiveAnalysis.benchmarks.industryAvgConversion}</div>
              <div>Top Performers: {analysis.competitiveAnalysis.benchmarks.topPerformerConversion}</div>
              <div className="font-semibold">Your Estimated: {analysis.competitiveAnalysis.benchmarks.yourEstimatedConversion}</div>
            </div>
          </div>
        </div>
      )}

      {/* Pro Upsell */}
      {!isPro && isLoggedIn && (
        <div className="bg-purple-100 border-2 border-purple-300 rounded p-6 text-center">
          <h3 className="text-lg font-bold mb-2">🚀 Want More Insights?</h3>
          <p className="text-sm mb-4">
            Unlock growth opportunities, behavioral insights, and implementation code with Pro
          </p>
          <button className="bg-purple-600 text-white px-6 py-2 rounded font-semibold hover:bg-purple-700">
            UPGRADE TO PRO
          </button>
        </div>
      )}
    </div>
  );
}