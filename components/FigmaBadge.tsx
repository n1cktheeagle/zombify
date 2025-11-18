'use client';

export function FigmaBadge() {
  return (
    <div className="figma-gradient-border">
      <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-black text-white rounded-full font-mono text-[11px] tracking-wider">
        <img src="/Figma-logo.svg" alt="Figma" width="8" height="8" className="object-contain" />
        <span>FIGMA INTEGRATION COMING SOON</span>
      </div>
      
      <style jsx>{`
        .figma-gradient-border {
          padding: 2px;
          border-radius: 9999px;
          background: linear-gradient(
            90deg,
            #0acf83,
            #a259ff,
            #f24e1e,
            #ff7262,
            #1abcfe,
            #0acf83
          );
          background-size: 200% 100%;
          animation: flow-gradient 3s linear infinite;
        }
        
        @keyframes flow-gradient {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
      `}</style>
    </div>
  );
}

