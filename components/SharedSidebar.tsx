'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  currentAnalysis?: {
    id: string;
    score: number;
    context: string;
    imageUrl: string;
    createdAt: string;
  } | null;
  recentAnalyses?: Array<{
    id: string;
    score: number;
    context: string;
    imageUrl: string;
    createdAt: string;
  }>;
  className?: string;
}

export function SharedSidebar({ currentAnalysis, recentAnalyses = [], className = '' }: SidebarProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();

  // Extract filename from image URL (fallback when original_filename is not available)
  const getImageFileName = (url: string) => {
    if (!url) return 'Unnamed Analysis';
    const segments = url.split('/');
    const filename = segments[segments.length - 1];
    // Remove common image extensions and return a more descriptive fallback
    const nameWithoutExt = filename.replace(/\.(png|jpg|jpeg|gif|webp)$/i, '');
    return nameWithoutExt || 'Unnamed Analysis';
  };

  return (
    <>
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-0' : 'w-64'} bg-[#f5f1e6] border-r border-black/10 flex-shrink-0 transition-all duration-300 overflow-hidden ${className}`}>
        {!sidebarCollapsed && (
          <div className="p-4 w-64">
            {/* Projects Section with Collapse Button */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wide">Projects</h3>
                <button 
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="w-6 h-6 border border-black/20 rounded flex items-center justify-center hover:bg-black/5 transition-colors"
                  title="Collapse Sidebar"
                >
                  <span className="text-xs">‹</span>
                </button>
              </div>
              <div className="text-center py-4">
                <div className="text-2xl opacity-30 mb-2">🔒</div>
                <p className="text-xs opacity-60 leading-relaxed">
                  Projects are only available for Pro users
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-black/10 mb-4"></div>

            {/* Recent Section */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide mb-3">Recent</h3>
              
              {/* Current Analysis */}
              {currentAnalysis && (
                <div className="p-3 rounded bg-black/5 border border-black/10 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold text-green-600">CURRENT</div>
                    <div className="text-xs bg-black/10 px-1.5 py-0.5 rounded font-mono text-[10px]">
                      {currentAnalysis.context?.replace('_', ' ') || 'UNKNOWN'}
                    </div>
                  </div>
                  <div className="text-sm font-medium truncate mb-1">
                    {getImageFileName(currentAnalysis.imageUrl)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-60">Grip Score</span>
                    <span className="text-sm font-bold">{currentAnalysis.score}</span>
                  </div>
                </div>
              )}

              {/* Recent Analyses */}
              {recentAnalyses.length > 0 && (
                <div className="space-y-2">
                  {recentAnalyses.slice(0, 5).map((analysis, index) => (
                    <button
                      key={analysis.id}
                      onClick={() => router.push(`/feedback/${analysis.id}`)}
                      className="w-full p-2 rounded border border-black/10 hover:bg-black/5 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-xs font-medium truncate">
                          {getImageFileName(analysis.imageUrl)}
                        </div>
                        <span className="text-xs font-bold ml-2">{analysis.score}</span>
                      </div>
                      <div className="text-xs opacity-60">
                        {new Date(analysis.createdAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {recentAnalyses.length === 0 && !currentAnalysis && (
                <div className="text-center py-4">
                  <div className="text-2xl opacity-30 mb-2">📊</div>
                  <p className="text-xs opacity-60 leading-relaxed">
                    Upload your first design to see recent analyses
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Collapsed Sidebar Toggle Button */}
      {sidebarCollapsed && (
        <div className="bg-[#f5f1e6] border-r border-black/10 flex flex-col w-12">
          <div className="p-4">
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-6 h-6 border border-black/20 rounded flex items-center justify-center hover:bg-black/5 transition-colors"
              title="Expand Sidebar"
            >
              <span className="text-xs">›</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}