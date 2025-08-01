import React from 'react';

interface GenerationalScore {
  score: number;
  reasoning: string;
}

interface GenerationalScores {
  genAlpha: GenerationalScore;
  genZ: GenerationalScore;
  millennials: GenerationalScore;
  genX: GenerationalScore;
  boomers: GenerationalScore;
}

interface Props {
  scores: GenerationalScores;
  primaryTarget: string;
}

export default function GenerationalRadarChart({ scores, primaryTarget }: Props) {
  // Add safety check for scores
  if (!scores) {
    return (
      <div className="w-full max-w-sm mx-auto text-center p-4">
        <div className="text-sm font-bold mb-1 font-mono">GENERATIONAL APPEAL</div>
        <p className="text-xs opacity-70 font-mono">Generational data unavailable</p>
      </div>
    );
  }
  
  // Chart dimensions - made smaller and more compact
  const size = 180;
  const center = size / 2;
  const radius = 60;
  
  // Generation data with positions - High contrast colors for better differentiation
  const generations = [
    { key: 'genAlpha', label: 'Gen Alpha', ageRange: '0-11', color: '#DC2626', angle: 0 }, // Red
    { key: 'genZ', label: 'Gen Z', ageRange: '12-27', color: '#7C3AED', angle: Math.PI / 2.5 }, // Purple
    { key: 'millennials', label: 'Millennials', ageRange: '28-43', color: '#000000', angle: 2 * Math.PI / 2.5 }, // Black
    { key: 'genX', label: 'Gen X', ageRange: '44-59', color: '#059669', angle: 3 * Math.PI / 2.5 }, // Green
    { key: 'boomers', label: 'Boomers', ageRange: '60-78', color: '#EA580C', angle: 4 * Math.PI / 2.5 } // Orange
  ];

  // Calculate points for the score polygon
  const scorePoints = generations.map(gen => {
    const generationData = scores?.[gen.key as keyof GenerationalScores];
    const score = generationData?.score || 0;
    const distance = (score / 100) * radius;
    const x = center + distance * Math.cos(gen.angle - Math.PI / 2);
    const y = center + distance * Math.sin(gen.angle - Math.PI / 2);
    return { x, y, score };
  });

  // Create path string for the score polygon
  const pathData = scorePoints.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ') + ' Z';

  // Grid circles (25%, 50%, 75%, 100%)
  const gridCircles = [25, 50, 75, 100].map(percent => ({
    radius: (percent / 100) * radius,
    opacity: percent === 100 ? 0.3 : 0.1
  }));

  return (
    <div className="w-full space-y-4">
      {/* Chart at the top */}
      <div className="flex flex-col items-center">
        <div className="text-center mb-3">
          <p className="text-xs opacity-70 font-mono">
            Target: <span className="font-bold">{
              generations.find(g => g.key === primaryTarget)?.label || 'Unknown'
            }</span>
          </p>
        </div>

        {/* Zombify-styled chart container */}
        <div className="border-2 border-black bg-white p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] relative">
          <svg width={size} height={size} className="mx-auto">
            {/* Grid circles */}
            {gridCircles.map((circle, index) => (
              <circle
                key={index}
                cx={center}
                cy={center}
                r={circle.radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                opacity={circle.opacity}
              />
            ))}

            {/* Axis lines */}
            {generations.map((gen, index) => {
              const x2 = center + radius * Math.cos(gen.angle - Math.PI / 2);
              const y2 = center + radius * Math.sin(gen.angle - Math.PI / 2);
              return (
                <line
                  key={index}
                  x1={center}
                  y1={center}
                  x2={x2}
                  y2={y2}
                  stroke="currentColor"
                  strokeWidth="1"
                  opacity="0.2"
                />
              );
            })}

            {/* Score polygon */}
            <path
              d={pathData}
              fill={generations.find(g => g.key === primaryTarget)?.color || '#000000'}
              fillOpacity="0.3"
              stroke={generations.find(g => g.key === primaryTarget)?.color || '#000000'}
              strokeWidth="3"
            />

            {/* Score points */}
            {scorePoints.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="4"
                fill={generations[index].color}
                stroke="#000000"
                strokeWidth="2"
              />
            ))}

            {/* Generation labels */}
            {generations.map((gen, index) => {
              const labelDistance = radius + 15;
              const x = center + labelDistance * Math.cos(gen.angle - Math.PI / 2);
              const y = center + labelDistance * Math.sin(gen.angle - Math.PI / 2);
              const generationData = scores?.[gen.key as keyof GenerationalScores];
              const score = generationData?.score || 0;
              
              return (
                <g key={index}>
                  <text
                    x={x}
                    y={y - 2}
                    textAnchor="middle"
                    className="text-xs font-bold fill-current"
                    style={{ color: gen.color }}
                  >
                    {gen.label.replace(' ', '')}
                  </text>
                  <text
                    x={x}
                    y={y + 10}
                    textAnchor="middle"
                    className="text-xs font-bold fill-current"
                    style={{ color: gen.color }}
                  >
                    {score}
                  </text>
                </g>
              );
            })}
          </svg>
          
          {/* Zombify status indicator */}
          <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 border border-black"></div>
        </div>
      </div>

      {/* Generation cards below the chart */}
      <div className="grid grid-cols-1 gap-2">
        {generations.map((gen) => {
          const generationScore = scores?.[gen.key as keyof GenerationalScores];
          if (!generationScore) return null;
          
          const isPrimary = gen.key === primaryTarget;
          
          return (
            <div 
              key={gen.key} 
              className={`bg-white border-2 border-black p-2 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] relative hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200 ${isPrimary ? 'ring-2 ring-offset-1' : ''}`}
              style={isPrimary ? { '--tw-ring-color': gen.color } as React.CSSProperties : undefined}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: gen.color }}
                  />
                  <span className="font-medium text-xs font-mono">{gen.label}</span>
                  <span className="text-xs opacity-60 font-mono">({gen.ageRange})</span>
                </div>
                <span className="font-bold text-xs font-mono" style={{ color: gen.color }}>
                  {generationScore.score}/100
                </span>
              </div>
              <p className="text-xs opacity-70 ml-4 font-mono leading-tight">
                {generationScore.reasoning}
              </p>
              
              {/* Generation status indicator */}
              <div className={`absolute top-1 right-1 w-1.5 h-1.5 border border-black ${
                generationScore.score >= 80 ? 'bg-green-500' : 
                generationScore.score >= 60 ? 'bg-yellow-500' : 
                'bg-red-500'
              }`}></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}