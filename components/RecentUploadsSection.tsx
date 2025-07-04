'use client'

import { useRouter } from 'next/navigation'
import { useUploads } from '@/contexts/UploadContext'
import Image from 'next/image'

// Define the upload type based on your actual data structure
interface Upload {
  id: string;
  image_url: string;
  score: number;
  created_at: string;
  analysis?: {
    context?: string;
  };
}

export default function RecentUploadsSection() {
  const router = useRouter();
  const { uploads } = useUploads();

  // Debug: Log uploads to verify data
  console.log('Recent uploads:', uploads);

  const handleNavigation = (uploadId: string) => {
    console.log('Navigation clicked for upload:', uploadId);
    
    // Ensure we have a valid ID
    if (!uploadId) {
      console.error('No upload ID provided');
      return;
    }

    const path = `/feedback/${uploadId}`;
    console.log('Navigating to:', path);
    
    try {
      router.push(path);
      console.log('Navigation initiated successfully');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  if (!uploads || uploads.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="text-2xl opacity-30 mb-2">📊</div>
        <p className="text-xs opacity-60 leading-relaxed">
          No recent uploads
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {uploads.map((upload) => (
        <div
          key={upload.id}
          className="flex items-center space-x-3 p-2 hover:bg-black/5 rounded cursor-pointer transition-colors relative z-10"
          onClick={() => {
            window.location.href = `/feedback/${upload.id}`;
          }}
          
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleNavigation(upload.id);
            }
          }}
        >
          {/* Thumbnail */}
          <div className="relative w-12 h-12 flex-shrink-0">
            {upload.image_url ? (
              <Image
                src={upload.image_url}
                alt={getImageFileName(upload.image_url)}
                fill
                className="object-cover rounded border border-black/20"
                sizes="48px"
                priority={false}
                onError={(e) => {
                  console.error('Image failed to load:', upload.image_url);
                  // Fallback to placeholder on error
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                onLoad={() => {
                  console.log('Image loaded successfully:', upload.image_url);
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                <span className="text-gray-400 text-xs">📊</span>
              </div>
            )}
          </div>

          {/* Upload Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {getImageFileName(upload.image_url || '')}
            </p>
            <div className="flex items-center justify-between text-xs opacity-60">
              <span>{new Date(upload.created_at).toLocaleDateString()}</span>
              <span className="font-bold">{upload.score || 0}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper function to extract filename from URL
function getImageFileName(url: string): string {
  if (!url) return 'Analysis';
  const segments = url.split('/');
  const filename = segments[segments.length - 1];
  return filename.replace('.png', '').replace('.jpg', '').replace('.jpeg', '') || 'Analysis';
}