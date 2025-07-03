// contexts/UploadContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Upload {
  id: string;
  image_url: string;
  score: number;
  created_at: string;
  analysis?: {
    context?: string;
  };
}

interface UploadContextType {
  uploads: Upload[];
  loading: boolean;
  refreshUploads: () => void;
  addUpload: (upload: Upload) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: ReactNode }) {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const initializeUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        await fetchUploads(user.id);
      } else {
        setLoading(false);
      }
    };

    initializeUser();
  }, []);

  const fetchUploads = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('id, image_url, score, created_at, analysis')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching uploads:', error);
        setUploads([]);
      } else {
        setUploads(data || []);
      }
    } catch (error) {
      console.error('Error fetching uploads:', error);
      setUploads([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshUploads = () => {
    if (user) {
      fetchUploads(user.id);
    }
  };

  const addUpload = (upload: Upload) => {
    setUploads(prev => [upload, ...prev.slice(0, 9)]);
  };

  return (
    <UploadContext.Provider value={{ uploads, loading, refreshUploads, addUpload }}>
      {children}
    </UploadContext.Provider>
  );
}

export const useUploads = () => {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUploads must be used within an UploadProvider');
  }
  return context;
};