import { motion } from 'framer-motion';
import GlitchText from './GlitchText';
import { feedbackTabs, FeedbackTabId } from './FeedbackDisplay';
import { ZombifyAnalysis } from '@/types/analysis';

interface FeedbackTabsProps {
  analysis: ZombifyAnalysis;
  activeTab: FeedbackTabId;
  setActiveTab: (tab: FeedbackTabId) => void;
  isPro: boolean;
}

export default function FeedbackTabs({ analysis, activeTab, setActiveTab, isPro }: FeedbackTabsProps) {
  return (
    <motion.div 
      className="flex flex-wrap gap-1 bg-black/5 p-2 rounded-lg border mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {feedbackTabs.map((tab) => {
        const count = tab.getCount(analysis);
        return (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as FeedbackTabId)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded font-mono text-sm font-bold transition-all
              ${activeTab === tab.id 
                ? 'bg-black text-white' 
                : 'bg-transparent hover:bg-black/10'
              }
              ${tab.pro && !isPro ? 'opacity-50' : ''}
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={tab.pro && !isPro}
          >
            <GlitchText 
              trigger={activeTab === tab.id ? 'continuous' : 'hover'}
              intensity="low"
            >
              {tab.label}
            </GlitchText>
            {count > 0 && (
              <motion.span 
                className={`
                  text-xs px-2 py-1 rounded-full font-bold
                  ${activeTab === tab.id 
                    ? 'bg-white text-black' 
                    : 'bg-black/20'
                  }
                `}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                {count}
              </motion.span>
            )}
            {tab.pro && !isPro && (
              <span className="text-xs bg-purple-600 text-white px-1 py-0.5 rounded">PRO</span>
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
} 