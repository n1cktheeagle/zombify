'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  copyable?: boolean;
}

export default function CodeBlock({ 
  code, 
  language = 'javascript', 
  title,
  copyable = true 
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Simple syntax highlighting for JavaScript/CSS
  const highlightCode = (code: string, lang: string) => {
    if (lang === 'css') {
      return code
        .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-gray-400">$1</span>')
        .replace(/(\.[a-zA-Z0-9_-]+|\#[a-zA-Z0-9_-]+)/g, '<span class="text-blue-400">$1</span>')
        .replace(/([a-zA-Z-]+)(\s*:)/g, '<span class="text-green-400">$1</span>$2')
        .replace(/(["'][^"']*["'])/g, '<span class="text-yellow-400">$1</span>');
    }

    // JavaScript highlighting
    return code
      .replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, '<span class="text-gray-400">$1</span>')
      .replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await)\b/g, '<span class="text-purple-400">$1</span>')
      .replace(/\b(true|false|null|undefined)\b/g, '<span class="text-orange-400">$1</span>')
      .replace(/(["'`][^"'`]*["'`])/g, '<span class="text-green-400">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="text-blue-400">$1</span>')
      .replace(/(\w+)(\s*\()/g, '<span class="text-yellow-400">$1</span>$2');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black rounded-lg overflow-hidden border border-gray-700 font-mono text-sm"
    >
      {/* Header */}
      {(title || copyable) && (
        <div className="flex justify-between items-center bg-gray-900 px-4 py-2 border-b border-gray-700">
          {title && (
            <span className="text-yellow-400 font-bold text-xs tracking-wide">
              {title.toUpperCase()}
            </span>
          )}
          {copyable && (
            <motion.button
              onClick={copyToClipboard}
              className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {copied ? (
                <>
                  ✓ COPIED
                </>
              ) : (
                <>
                  📋 COPY
                </>
              )}
            </motion.button>
          )}
        </div>
      )}

      {/* Code Content */}
      <div className="p-4 overflow-x-auto">
        <motion.pre
          className="text-gray-100 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <code 
            dangerouslySetInnerHTML={{ 
              __html: highlightCode(code, language) 
            }}
          />
        </motion.pre>
      </div>

      {/* Terminal-style bottom border */}
      <motion.div
        className="h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500"
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 1, delay: 0.5 }}
      />
    </motion.div>
  );
}