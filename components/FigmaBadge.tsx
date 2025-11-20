'use client';

export function FigmaBadge() {
  return (
    <div className="figma-gradient-border">
      <div className="content-wrapper inline-flex items-center gap-2.5 px-3 py-1.5 bg-[#f5f1e6] text-black rounded-full font-mono text-[11px] tracking-wider">
        <img src="/Figma-logo.svg" alt="Figma" width="8" height="8" className="object-contain" />
        <span>FIGMA INTEGRATION COMING SOON</span>
      </div>
      
      <style jsx>{`
        .figma-gradient-border {
          position: relative;
          display: inline-flex;
          padding: 2px;
          border-radius: 9999px;
          overflow: hidden;
        }
        
        .figma-gradient-border::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 500%;
          aspect-ratio: 1;
          background: conic-gradient(
            from 0deg,
            #0acf83,
            #a259ff,
            #f24e1e,
            #ff7262,
            #1abcfe,
            #0acf83
          );
          transform: translate(-50%, -50%);
          animation: spin 4s linear infinite;
        }
        
        .content-wrapper {
          position: relative;
          z-index: 1;
        }
        
        @keyframes spin {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
