import React from 'react';
import { Folder, Clock, Lock } from 'lucide-react';

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
}

export default function DashboardSidebar({ 
  isLoggedIn = false, 
  isPro = false, 
  projects = [], 
  recentAnalyses = [], 
  currentAnalysis 
}: SidebarProps) {
  
  return (
    <div className="w-64 h-screen bg-[#f5f1e6] border-r border-black/10 flex flex-col font-mono">
      {/* Header */}
      <div className="p-4 border-b border-black/10">
        <div className="text-lg font-bold tracking-tight text-black">
          ZOMBIFY
        </div>
        <div className="text-xs opacity-60 mt-1">
          DASHBOARD
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
            {/* Current Analysis (if on feedback page) */}
            {currentAnalysis && (
              <div className="p-3 rounded bg-black/5 border border-black/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-green-600">CURRENT</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-black/10 px-2 py-1 rounded font-mono">
                      {currentAnalysis.context.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="text-sm font-medium truncate mb-1">
                  {currentAnalysis.fileName}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs opacity-60">Grip Score</span>
                  <span className="text-sm font-bold">{currentAnalysis.gripScore}</span>
                </div>
              </div>
            )}
            
            {/* Previous Analyses */}
            {recentAnalyses.length === 0 && !currentAnalysis ? (
              <div className="text-center py-4">
                <p className="text-xs opacity-60">No recent analyses</p>
              </div>
            ) : (
              recentAnalyses.slice(0, 5).map((analysis) => (
                <div
                  key={analysis.id}
                  className="p-2 rounded hover:bg-black/5 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium truncate flex-1 group-hover:text-black">
                      {analysis.fileName}
                    </div>
                    <div className="text-sm font-bold ml-2">{analysis.gripScore}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-black/10 px-2 py-1 rounded font-mono">
                      {analysis.context.replace('_', ' ')}
                    </span>
                    <span className="text-xs opacity-60">
                      {new Date(analysis.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-black/10">
        <div className="text-xs opacity-50 text-center">
          Signal received. Pattern recognized.
        </div>
      </div>
    </div>
  );
}