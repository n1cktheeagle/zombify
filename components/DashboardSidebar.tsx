import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Folder, Clock, Lock, ChevronDown, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';

interface RecentAnalysis {
  id: string;
  fileName: string;
  gripScore: number;
  context: string;
  timestamp: string;
}

interface Project {
  id: string;
  name: string;
  analysisCount: number;
  lastModified: string;
}

interface SidebarProps {
  isLoggedIn?: boolean;
  isPro?: boolean;
  projects?: Project[];
  recentAnalyses?: RecentAnalysis[];
  currentAnalysis?: RecentAnalysis;
  loading?: boolean;
}

export default function DashboardSidebar({ 
  isLoggedIn = false, 
  isPro = false, 
  projects = [], 
  recentAnalyses = [], 
  currentAnalysis,
  loading = false
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  // Extract feedback ID from current pathname
  const getCurrentFeedbackId = () => {
    if (pathname?.startsWith('/feedback/')) {
      return pathname.split('/')[2];
    }
    return null;
  };

  const currentFeedbackId = getCurrentFeedbackId();

  const handleAnalysisClick = (analysisId: string) => {
    router.push(`/feedback/${analysisId}`);
  };

  const handleProjectClick = (projectId: string) => {
    // Navigate to project page when you implement it
    console.log('Navigate to project:', projectId);
  };

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await signOut();
  };

  const handleSettings = () => {
    router.push('/settings');
    setShowProfileMenu(false);
  };
  
  return (
    <div className="w-full h-full bg-[#f5f1e6] border-r border-black/10 flex flex-col font-mono">
      {/* Header with Logo */}
      <div className="p-4 border-b border-black/10">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push('/dashboard')}
        >
          <Image 
            src="/logo.png" 
            alt="Logo" 
            width={28} 
            height={28} 
            className="object-contain"
          />
          <div className="text-lg font-bold tracking-tight text-black">
            ZOMBIFY
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wide">Projects</h3>
            <Folder className="w-4 h-4 opacity-60" />
          </div>
          
          {!isLoggedIn || !isPro ? (
            <div className="text-center py-6 px-2">
              <Lock className="w-8 h-8 mx-auto opacity-30 mb-2" />
              <p className="text-xs opacity-60 leading-relaxed">
                Projects are only available for Pro users
              </p>
              {!isPro && isLoggedIn && (
                <button className="mt-3 text-xs font-mono tracking-wide px-3 py-1 border border-black/20 hover:border-black/40 hover:bg-black/5 transition-all">
                  UPGRADE
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {projects.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs opacity-60">No projects yet</p>
                  <button className="mt-2 text-xs font-mono tracking-wide px-3 py-1 border border-black/20 hover:border-black/40 hover:bg-black/5 transition-all">
                    CREATE PROJECT
                  </button>
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="p-2 rounded hover:bg-black/5 cursor-pointer transition-colors group"
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <div className="text-sm font-medium truncate group-hover:text-black">
                      {project.name}
                    </div>
                    <div className="text-xs opacity-60 flex items-center justify-between mt-1">
                      <span>{project.analysisCount} analyses</span>
                      <span>{new Date(project.lastModified).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-black/10 mx-4"></div>

        {/* Recent Section */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wide">Recent</h3>
            <Clock className="w-4 h-4 opacity-60" />
          </div>
          
          <div className="space-y-2">
            {/* All Recent Analyses - Keep positions stable */}
            {loading ? (
              <div className="text-center py-4">
                <p className="text-xs opacity-60">Loading recent analyses...</p>
              </div>
            ) : recentAnalyses.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs opacity-60">No recent analyses</p>
              </div>
            ) : (
              // Show all recent analyses, highlight based on current URL
              recentAnalyses.map((analysis) => {
                const isCurrent = currentFeedbackId === analysis.id;
                return (
                  <div
                    key={analysis.id}
                    className={`p-3 rounded cursor-pointer transition-all duration-200 group \
                      ${isCurrent 
                        ? 'bg-black text-white font-bold font-mono' 
                        : 'bg-transparent hover:bg-black/10'}
                    `}
                    onClick={() => handleAnalysisClick(analysis.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className={`text-xs font-medium truncate transition-colors \
                          ${isCurrent ? 'text-white font-bold' : 'group-hover:text-black'}`}
                        >
                          {analysis.fileName}
                        </div>
                        <div className={`text-xs mt-1 transition-colors \
                          ${isCurrent ? 'text-white opacity-90' : 'opacity-60'}`}
                        >
                          {new Date(analysis.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`text-base font-bold ml-3 transition-colors \
                        ${isCurrent ? 'text-white' : ''}`}
                      >
                        {analysis.gripScore}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Profile Section at Bottom */}
      {isLoggedIn && user && (
        <div className="border-t border-black/10 p-4 relative" ref={dropdownRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-full flex items-center gap-3 p-2 rounded hover:bg-black/5 transition-colors"
          >
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium truncate">
                {user.email?.split('@')[0] || 'User'}
              </div>
              <div className="text-xs opacity-60">
                {isPro ? 'Pro Account' : 'Free Account'}
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-black/20 rounded shadow-lg z-50">
              <div className="py-2">
                <button
                  onClick={handleSettings}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-red-50 text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer for non-logged in users */}
      {!isLoggedIn && (
        <div className="p-4 border-t border-black/10">
          <div className="text-xs opacity-50 text-center">
            Signal received. Pattern recognized.
          </div>
        </div>
      )}
    </div>
  );
}