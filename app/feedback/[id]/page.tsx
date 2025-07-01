// app/feedback/[id]/page.tsx
export default async function FeedbackPage({ params }: { params: { id: string } }) {
  // Mock data for now
  const mockData = {
    id: params.id,
    score: Math.floor(Math.random() * 40) + 60,
    issues: [
      'CTA button contrast too low',
      'Visual hierarchy unclear', 
      'Touch targets below minimum size'
    ],
    image_url: 'https://via.placeholder.com/400x300?text=Your+Screenshot',
    chain_id: 'mock-chain-id'
  };

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Feedback Result</h1>
      <p className="mt-2">ID: {mockData.id}</p>
      <p className="mt-2">Score: {mockData.score}</p>
      
      <p className="mt-2">Issues:</p>
      <ul className="list-disc ml-5">
        {mockData.issues.map((issue: string, i: number) => (
          <li key={i}>{issue}</li>
        ))}
      </ul>
      
      <img
        src={mockData.image_url}
        alt="Screenshot"
        className="mt-6 border rounded max-w-md"
      />
      
      <div className="mt-8 p-4 bg-yellow-100 rounded">
        <p className="text-sm">
          <strong>Note:</strong> This is mock data. Once we fix the Supabase issue, 
          this will show your actual uploaded image and AI analysis.
        </p>
      </div>
    </div>
  );
}