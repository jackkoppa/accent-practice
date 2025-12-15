import React from 'react';

interface ScoreRingProps {
  score: number;
  label: string;
  color: string;
  size?: number;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({ 
  score, 
  label, 
  color,
  size = 120 
}) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getScoreColor = () => {
    if (score >= 80) return 'text-neo-success';
    if (score >= 60) return 'text-neo-warning';
    return 'text-neo-error';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background ring */}
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-gray-200"
          />
          {/* Progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="square"
            className="score-ring"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
            }}
          />
        </svg>
        {/* Border around the ring */}
        <div 
          className="absolute inset-0 border-3 border-black rounded-full"
          style={{ margin: strokeWidth / 2 }}
        />
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-black ${getScoreColor()}`}>
            {Math.round(score)}
          </span>
        </div>
      </div>
      <span className="mt-2 text-sm font-black">{label}</span>
    </div>
  );
};
