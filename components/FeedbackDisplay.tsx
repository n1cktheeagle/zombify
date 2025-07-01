type FeedbackDisplayProps = {
    image_url: string;
    grip_score: number;
    feedback_chunks: { text: string; category: string }[];
  };
  
  export default function FeedbackDisplay({
    image_url,
    grip_score,
    feedback_chunks,
  }: FeedbackDisplayProps) {
    return (
      <div className="p-8 space-y-6">
        <img src={image_url} alt="Uploaded UI" className="w-full max-w-xl rounded" />
        <div className="text-xl font-bold">Grip Score: {grip_score}</div>
        <div className="space-y-4">
          {feedback_chunks.map((chunk, index) => (
            <div key={index} className="border p-4 rounded">
              <div className="text-sm text-gray-500">{chunk.category}</div>
              <div>{chunk.text}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }