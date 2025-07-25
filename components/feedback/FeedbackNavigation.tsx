'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlitchText from '../GlitchText';

interface NavigationSection {
  id: string;
  title: string;
  icon: string;
  count?: number;
  completed?: boolean;
}

interface FeedbackNavigationProps {
  sections: NavigationSection[];
  activeSection?: string;
  onSectionChange?: (sectionId: string) => void;
  className?: string;
}

export default function FeedbackNavigation({ 
  sections, 
  activeSection,
  onSectionChange,
  className = '' 
}: FeedbackNavigationProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Handle scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.pageYOffset;
      const progress = Math.min(currentScroll / totalScroll, 1);
      setScrollProgress(progress);

      // Auto-hide when scrolling down fast
      const scrollSpeed = Math.abs(currentScroll - (window as any).lastScrollY || 0);
      (window as any).lastScrollY = currentScroll;
      
      if (scrollSpeed > 10 && currentScroll > 200) {
        setIsVisible(false);
      } else if (scrollSpeed < 5) {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Account for fixed header
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
      onSectionChange?.(sectionId);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className={`fixed right-6 top-1/2 -translate-y-1/2 z-40 ${className}`}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 0.3 }}
        >
          {/* Navigation Container */}
          <motion.div 
            className={`bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden shadow-xl ${
              isMinimized ? 'w-16' : 'w-64'
            }`}
            layout
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/20">
              <div className="flex items-center justify-between">
                {!isMinimized && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <GlitchText className="text-sm font-bold text-white" trigger="hover">
                      NAVIGATION
                    </GlitchText>
                  </motion.div>
                )}
                
                <motion.button
                  className="text-white/60 hover:text-white transition-colors p-1"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  <motion.div
                    animate={{ rotate: isMinimized ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isMinimized ? '→' : '←'}
                  </motion.div>
                </motion.button>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-white/20 rounded-full h-1">
                  <motion.div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${scrollProgress * 100}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                {!isMinimized && (
                  <div className="text-xs text-white/60 mt-1 font-mono">
                    {Math.round(scrollProgress * 100)}% complete
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Items */}
            <div className="p-2">
              {sections.map((section, index) => (
                <motion.button
                  key={section.id}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 mb-1 ${
                    activeSection === section.id
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => scrollToSection(section.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className="text-lg flex-shrink-0">{section.icon}</div>
                    
                    {/* Content */}
                    {!isMinimized && (
                      <motion.div 
                        className="flex-1 min-w-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm truncate">
                            {section.title}
                          </div>
                          
                          {/* Count Badge */}
                          {section.count !== undefined && section.count > 0 && (
                            <motion.span 
                              className="bg-red-500/80 text-white text-xs px-2 py-0.5 rounded-full font-mono font-bold ml-2"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              whileHover={{ scale: 1.1 }}
                            >
                              {section.count}
                            </motion.span>
                          )}
                          
                          {/* Completed Indicator */}
                          {section.completed && (
                            <motion.div
                              className="text-green-400 text-sm ml-2"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              whileHover={{ scale: 1.1 }}
                            >
                              ✓
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Active Indicator */}
                    {activeSection === section.id && (
                      <motion.div
                        className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        layoutId="activeIndicator"
                      />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-white/20">
              {!isMinimized ? (
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.button
                    className="w-full text-left p-2 text-white/60 hover:text-white transition-colors text-sm font-mono"
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    ↑ Back to Top
                  </motion.button>
                  
                  <motion.button
                    className="w-full text-left p-2 text-white/60 hover:text-white transition-colors text-sm font-mono"
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                  >
                    ↓ Scroll to Bottom
                  </motion.button>
                </motion.div>
              ) : (
                <div className="flex flex-col gap-2">
                  <motion.button
                    className="text-white/60 hover:text-white transition-colors text-lg"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    title="Back to Top"
                  >
                    ↑
                  </motion.button>
                  
                  <motion.button
                    className="text-white/60 hover:text-white transition-colors text-lg"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                    title="Scroll to Bottom"
                  >
                    ↓
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Keyboard Shortcut Hint */}
          {!isMinimized && (
            <motion.div 
              className="mt-2 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="text-xs text-white/40 font-mono bg-black/60 px-2 py-1 rounded">
                Press J/K to navigate
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Keyboard navigation hook
export function useFeedbackNavigation(sections: NavigationSection[]) {
  const [activeSection, setActiveSection] = useState<string>(() => {
    // Initialize with first section ID or empty string
    return sections.length > 0 ? sections[0].id : '';
  });

  // Update active section if sections change and current active is not in new sections
  useEffect(() => {
    if (sections.length > 0 && !sections.find(s => s.id === activeSection)) {
      setActiveSection(sections[0].id);
    }
  }, [sections, activeSection]);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't interfere with form inputs
      }

      const currentIndex = sections.findIndex(s => s.id === activeSection);
      
      if (e.key === 'j' || e.key === 'J') {
        // Next section
        const nextIndex = Math.min(currentIndex + 1, sections.length - 1);
        const nextSection = sections[nextIndex];
        if (nextSection) {
          setActiveSection(nextSection.id);
          document.getElementById(nextSection.id)?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      } else if (e.key === 'k' || e.key === 'K') {
        // Previous section
        const prevIndex = Math.max(currentIndex - 1, 0);
        const prevSection = sections[prevIndex];
        if (prevSection) {
          setActiveSection(prevSection.id);
          document.getElementById(prevSection.id)?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [activeSection, sections]);

  return { activeSection, setActiveSection };
} 