interface FeedbackLoaderProps {
    feedback: any
  }
  
  export default function FeedbackLoader({ feedback }: FeedbackLoaderProps) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-2">Feedback</h1>
        <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(feedback, null, 2)}</pre>
      </div>
    )
  }