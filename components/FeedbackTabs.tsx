import { motion } from 'framer-motion';
import GlitchText from './GlitchText';
import { ZombifyAnalysis } from '@/types/analysis';

// Updated tab structure to match the current sections
export type FeedbackSectionId = 'summary' | 'issues' | 'detailed-analysis' | 'opportunities' | 'insights' | 'accessibility';

export const feedbackSections = [
  { 
    id: 'summary', 
    label: 'EXECUTIVE SUMMARY', 
    getCount: () => 0 
  },
  { 
    id: 'issues', 
    label: 'ISSUES & FIXES', 
    getCount: (a: ZombifyAnalysis) => (a.criticalIssues?.length || 0) + (a.usabilityIssues?.length || 0) 
  },
  { 
    id: 'detailed-analysis', 
    label: 'DETAILED ANALYSIS', 
    getCount: () => 0 
  },
  { 
    id: 'opportunities', 
    label: 'OPPORTUNITIES', 
    getCount: (a: ZombifyAnalysis) => a.opportunities?.length || 0, 
    pro: true 
  },
  { 
    id: 'insights', 
    label: 'BEHAVIORAL INSIGHTS', 
    getCount: (a: ZombifyAnalysis) => a.behavioralInsights?.length || 0, 
    pro: true 
  },
  { 
    id: 'accessibility', 
    label: 'ACCESSIBILITY', 
    getCount: (a: ZombifyAnalysis) => a.accessibilityAudit?.criticalFailures?.length || 0 
  }
];

interface FeedbackTabsProps {
  analysis: ZombifyAnalysis;
  activeSection: FeedbackSectionId;
  setActiveSection: (section: FeedbackSectionId) => void;
  isPro: boolean;
}

export default function FeedbackTabs({ analysis, activeSection, setActiveSection, isPro }: FeedbackTabsProps) {
  const scrollToSection = (sectionId: FeedbackSectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      // Find the specific feedback scroll container
      const scrollContainer = document.getElementById('feedback-scroll-container') as HTMLElement;
      
      if (scrollContainer) {
        // Calculate offset for sticky tabs
        const headerHeight = 150; // Height for sticky tabs and padding
        const elementPosition = element.offsetTop - headerHeight;
        
        scrollContainer.scrollTo({
          top: Math.max(0, elementPosition),
          behavior: 'smooth'
        });
      } else {
        // Fallback to regular window scrolling
        element.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  };

  return (
    <motion.div 
      className="sticky top-0 z-20 bg-[#f5f1e6] pb-4 mb-8 border-b-2 border-black relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      style={{
        backgroundImage: `repeating-linear-gradient(
          90deg,
          transparent,
          transparent 98px,
          rgba(0,0,0,0.02) 100px
        )`
      }}
    >
      {/* Terminal-style header */}
      <div className="font-mono text-xs text-black/60 mb-3 tracking-wider flex items-center gap-2">
        <span className="text-black/40">●</span>
        <span>&gt;&gt; NAVIGATION_MATRIX.EXE</span>
        <motion.span 
          className="text-black/40"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          _
        </motion.span>
      </div>
      
      <div className="flex flex-wrap gap-1">
      {feedbackSections.map((section) => {
        const count = section.getCount(analysis);
        return (
          <motion.button
            key={section.id}
            onClick={() => scrollToSection(section.id as FeedbackSectionId)}
                          className={`
                relative flex items-center gap-2 px-3 py-2 font-mono text-xs font-bold transition-all
                border-2 border-black bg-[#f5f1e6] hover:bg-black hover:text-white
                ${activeSection === section.id 
                  ? 'bg-black text-white shadow-lg transform translate-x-1 translate-y-1' 
                  : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1'
                }
                ${section.pro && !isPro ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={section.pro && !isPro}
          >
            <span className="flex items-center gap-1">
              <span className="text-black/60">[</span>
              <GlitchText 
                trigger={activeSection === section.id ? 'continuous' : 'hover'}
                intensity="low"
                className="tracking-wider"
              >
                {section.label}
              </GlitchText>
              <span className="text-black/60">]</span>
            </span>
                          {count > 0 && (
                <motion.span 
                  className={`
                    text-xs px-1 py-0.5 font-bold font-mono border border-current
                    ${activeSection === section.id 
                      ? 'bg-white text-black border-white' 
                      : 'bg-black text-white border-black'
                    }
                  `}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {count.toString().padStart(2, '0')}
                </motion.span>
              )}
                          {section.pro && !isPro && (
                <span className="text-xs bg-black text-white px-1 py-0.5 font-mono border border-black">
                  &lt;PRO&gt;
                </span>
              )}
          </motion.button>
                  );
        })}
      </div>
    </motion.div>
  );
}