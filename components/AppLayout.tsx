'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { MainHeader } from '@/components/MainHeader';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useAuth } from '@/hooks/useAuth';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface AppLayoutProps {
  children: ReactNode;
  currentAnalysis?: {
    id: string;
    fileName: string;
    gripScore: number;
    context: string;
    timestamp: string;
  };
}

interface FeedbackItem {
  id: string;
  score: number;
  created_at: string;
  user_id: string | null;
  is_guest: boolean;
  image_url: string;
  analysis?: any;
}

export function AppLayout({ children, currentAnalysis }: AppLayoutProps) {
  const { user, profile, loading } = useAuth();
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [sidebarDataLoaded, setSidebarDataLoaded] = useState(false);
  const pathname = usePathname();
  const dataLoadedRef = useRef(false);
  
  const supabase = createClientComponentClient();

  // Load sidebar data only once and persist it
  useEffect(() => {
    // Only load if user exists and data hasn't been loaded yet
    if (!user || dataLoadedRef.current) {
      setSidebarLoading(false);
      return;
    }

    const loadSidebarData = async () => {
      try {
        console.log('🔄 Loading sidebar data (one time only)...');
        
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
            fileName: `Analysis #${item.id.slice(0, 8)}`,
            gripScore: item.score,
            context: item.user_id ? 'user_upload' : 'guest_upload',
            timestamp: item.created_at
          }));
          
          setRecentAnalyses(transformedAnalyses);
          console.log('✅ Sidebar data loaded:', transformedAnalyses.length, 'analyses');
        }

        // For now, projects will be empty since you're not using them yet
        setProjects([]);
        
        // Mark data as loaded
        dataLoadedRef.current = true;
        setSidebarDataLoaded(true);
        
      } catch (error) {
        console.error('Error loading sidebar data:', error);
      } finally {
        setSidebarLoading(false);
      }
    };

    loadSidebarData();
  }, [user, supabase]);

  // Function to get current analysis for the current page
  const getCurrentAnalysisForPage = () => {
    if (!currentAnalysis) return undefined;
    
    // Only show current analysis indicator on feedback pages
    if (pathname?.startsWith('/feedback/')) {
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
      
      {/* Main Content - With left margin for sidebar, no top padding */}
      <div className="ml-64 min-h-screen">
        {children}
      </div>
    </div>
  );
}