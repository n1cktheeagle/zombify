'use client';

import React from 'react';

type Feedback = {
  id: string;
  created_at: string;
  image_url?: string;
  project_name?: string;
  analysis?: {
    score?: number;
    issues?: string[];
  };
  [key: string]: any;
};

export default function FeedbackResults({ feedback }: { feedback: Feedback }) {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-mono font-bold">Feedback Result</h1>

      <p>
        <strong>ID:</strong> {feedback.id}
      </p>
      <p>
        <strong>Created At:</strong> {feedback.created_at}
      </p>

      {feedback.project_name && (
        <p>
          <strong>Project:</strong> {feedback.project_name}
        </p>
      )}

      {feedback.image_url && (
        <div>
          <strong>Screenshot:</strong>
          <div className="mt-2">
            <img
              src={feedback.image_url}
              alt="Uploaded UI"
              className="rounded-md shadow-md max-w-md"
            />
          </div>
        </div>
      )}

      {feedback.analysis && (
        <div>
          <strong>Score:</strong> {feedback.analysis.score ?? 'N/A'}
          <ul className="list-disc ml-6 mt-2 text-sm text-gray-800">
            {(feedback.analysis.issues ?? []).map((issue: string, i: number) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      <details className="mt-6">
        <summary className="text-blue-600 cursor-pointer">Full JSON</summary>
        <pre className="mt-2 bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
          {JSON.stringify(feedback, null, 2)}
        </pre>
      </details>
    </div>
  );
}