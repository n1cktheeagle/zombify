// contexts/UploadContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CurrentAnalysis {
  id: string;
  fileName: string;
  gripScore: number;
  context: string;
  timestamp: string;
}

interface UploadContextType {
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
  uploadProgress: number;
  setUploadProgress: (progress: number) => void;
  currentAnalysis: CurrentAnalysis | null;
  setCurrentAnalysis: (analysis: CurrentAnalysis | null) => void;
  lastUploadId: string | null;
  setLastUploadId: (id: string | null) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: ReactNode }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentAnalysis, setCurrentAnalysis] = useState<CurrentAnalysis | null>(null);
  const [lastUploadId, setLastUploadId] = useState<string | null>(null);

  return (
    <UploadContext.Provider value={{
      isUploading,
      setIsUploading,
      uploadProgress,
      setUploadProgress,
      currentAnalysis,
      setCurrentAnalysis,
      lastUploadId,
      setLastUploadId
    }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
}