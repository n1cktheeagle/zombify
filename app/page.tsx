'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_name', 'Untitled');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        // Remove redirect: 'manual' - let it follow redirects normally
      });

      // Check if we ended up on a feedback page
      if (res.url.includes('/feedback/')) {
        // Extract the ID from the current URL and navigate there
        const id = res.url.split('/feedback/')[1];
        router.push(`/feedback/${id}`);
        return;
      }

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Upload failed');
        setUploading(false);
        return;
      }

      // If we get here, something unexpected happened
      setError('Unexpected response from server');
      setUploading(false);

    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload failed');
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-100 px-4">
      <h1 className="text-4xl font-bold mb-6 text-center">Zombify your design</h1>

      <label className="cursor-pointer bg-black text-white px-6 py-3 rounded-md hover:bg-zinc-800 transition-all">
        {uploading ? 'Uploading...' : 'Upload Screenshot'}
        <input
          type="file"
          name="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />
      </label>

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </main>
  );
}