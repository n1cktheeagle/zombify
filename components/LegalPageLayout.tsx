'use client';

import { LandingHeader } from '@/components/LandingHeader';
import { LandingFooter } from '@/components/LandingFooter';

interface LegalPageLayoutProps {
  title: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export function LegalPageLayout({ title, lastUpdated = 'November 2025', children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f5f1e6] text-black font-mono">
      <LandingHeader />

      {/* Content */}
      <div className="pt-20 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            {lastUpdated && (
              <p className="text-sm opacity-70">Last updated: {lastUpdated}</p>
            )}
          </div>

          <div className="prose prose-sm max-w-none">
            {children}
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}

