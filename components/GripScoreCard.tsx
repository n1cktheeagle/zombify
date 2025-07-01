'use client';

type GripScoreCardProps = {
  score: number;
};

export default function GripScoreCard({ score }: GripScoreCardProps) {
  return (
    <div className="rounded-2xl shadow p-4 border bg-white">
      <h2 className="text-lg font-semibold">Grip Score</h2>
      <div className="text-4xl font-bold mt-2">{score}/100</div>
    </div>
  );
}