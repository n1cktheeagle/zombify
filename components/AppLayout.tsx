'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { MainHeader } from '@/components/MainHeader';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useAuth } from '@/hooks/useAuth';
import { useUpload } from '@/contexts/UploadContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface FeedbackItem {
  id: string;
  image_url: string;
  score: number;
  created_at: string;
  original_filename: string | null;
  user_id: string | null;
}

interface AppLayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
}

export function AppLayout({ children, fullWidth = false }: AppLayoutProps) {
  const { user, profile, loading } = useAuth();
  const { currentAnalysis, lastUploadId } = useUpload();
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [lastProcessedUploadId, setLastProcessedUploadId] = useState<string | null>(null);
  const pathname = usePathname();
  const dataLoadedRef = useRef(false);
  
  const supabase = createClientComponentClient();

  // Auto-detect full width for certain pages
  const shouldBeFullWidth = fullWidth || pathname?.startsWith('/feedback/');

  // Load sidebar data initially and when there's a new upload
  useEffect(() => {
    if (!user) {
      setSidebarLoading(false);
      dataLoadedRef.current = false;
      return;
    }

    // Only reload if:
    // 1. Data hasn't been loaded yet, OR
    // 2. There's a new upload that we haven't processed yet
    const shouldLoad = !dataLoadedRef.current || 
                      (lastUploadId && lastUploadId !== lastProcessedUploadId);

    if (!shouldLoad) {
      return;
    }

    const loadSidebarData = async () => {
      try {
        console.log('🔄 Loading sidebar data...');
        setSidebarLoading(true);
        
        // Load recent analyses for sidebar
        const { data: feedbackData, error: feedbackError } = await supabase
          .from('feedback')
          .select('*')
          .or(`user_id.eq.${user.id},and(user_id.is.null,is_guest.eq.true)`)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!feedbackError && feedbackData) {
          // Transform feedback data to match sidebar interface
          const transformedAnalyses = feedbackData.map((item: FeedbackItem) => ({
            id: item.id,
            fileName: item.original_filename || `Analysis #${item.id.slice(0, 8)}`,
            gripScore: item.score,
            context: item.user_id ? 'user_upload' : 'guest_upload',
            timestamp: item.created_at
          }));
          
          setRecentAnalyses(transformedAnalyses);
          console.log('✅ Sidebar data loaded:', transformedAnalyses.length, 'analyses');
        }

        // For now, projects will be empty since you're not using them yet
        setProjects([]);
        
        // Mark data as loaded and update last processed upload ID
        dataLoadedRef.current = true;
        if (lastUploadId) {
          setLastProcessedUploadId(lastUploadId);
        }
        
      } catch (error) {
        console.error('Error loading sidebar data:', error);
      } finally {
        setSidebarLoading(false);
      }
    };

    loadSidebarData();
  }, [user, supabase, lastUploadId, lastProcessedUploadId]);

  // Function to get current analysis for the current page
  const getCurrentAnalysisForPage = () => {
    // Only show current analysis indicator on feedback pages
    if (pathname?.startsWith('/feedback/') && currentAnalysis) {
      return currentAnalysis;
    }
    
    return undefined;
  };

  // If user is not authenticated or still loading, render children without layout
  if (!user || loading) {
    return <>{children}</>;
  }

  // Render authenticated layout
  return (
    <div className="min-h-screen bg-[#f5f1e6] text-black font-mono">
      {/* Commented out main header for now */}
      {/* <MainHeader variant="app" /> */}
      
      {/* Sidebar - Fixed position, full height */}
      <div className="fixed top-0 left-0 z-40 w-64 h-screen">
        <DashboardSidebar
          isLoggedIn={!!user}
          isPro={profile?.plan_type === 'pro'}
          projects={projects}
          recentAnalyses={recentAnalyses}
          currentAnalysis={getCurrentAnalysisForPage()}
          loading={sidebarLoading}
        />
      </div>
      
      {/* Main Content - Always uses margin left for sidebar space */}
      <div className="ml-64 min-h-screen">
        {children}
      </div>
    </div>
  );
}