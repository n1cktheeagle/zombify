import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="border-t border-black/10 py-8 px-6 text-center">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Social Links */}
        <div className="flex items-center justify-center gap-6">
          <a href="https://discord.gg/ynDpjDeRTr" aria-label="Discord" className="opacity-60 hover:opacity-100 transition-opacity">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.25A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.046-.32 13.41.099 17.731a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
            </svg>
          </a>
          <a href="mailto:hi@zombify.ai" aria-label="Email" className="opacity-60 hover:opacity-100 transition-opacity">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M1.5 8.67V18A2.25 2.25 0 003.75 20.25h16.5A2.25 2.25 0 0022.5 18V8.67l-8.31 5.19a3 3 0 01-3.18 0L1.5 8.67z" />
              <path d="M22.5 6.75V6A2.25 2.25 0 0020.25 3.75H3.75A2.25 2.25 0 001.5 6v.75l9.03 5.64a1.5 1.5 0 001.56 0L22.5 6.75z" />
            </svg>
          </a>
        </div>
        
        {/* Legal Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link href="/privacy" className="font-mono text-sm opacity-60 hover:opacity-100 transition-opacity">
            Privacy
          </Link>
          <Link href="/terms" className="font-mono text-sm opacity-60 hover:opacity-100 transition-opacity">
            Terms
          </Link>
          <Link href="/ai-disclaimer" className="font-mono text-sm opacity-60 hover:opacity-100 transition-opacity">
            AI Disclaimer
          </Link>
          <Link href="/cookies" className="font-mono text-sm opacity-60 hover:opacity-100 transition-opacity">
            Cookies
          </Link>
        </div>
        
        {/* Copyright */}
        <div>
          <p className="text-[10px] font-mono opacity-60">
            Designed with 0 figma files. Built for the era of collapsing attention.
          </p>
          <p className="text-[10px] font-mono opacity-60 mt-2">© 2025 Zombify - A product of Firststab (Pty) Ltd</p>
        </div>
      </div>
    </footer>
  );
}

