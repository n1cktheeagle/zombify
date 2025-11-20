'use client';

import { useEffect, useState } from 'react'
import GlitchText from '@/components/GlitchText'
import GlitchTranslate from '@/components/GlitchTranslate'
import GlitchArt from '@/components/GlitchArt'
import { GuestUploadZone } from '@/components/GuestUploadZone'
import { LandingHeader } from '@/components/LandingHeader'
import { LandingFooter } from '@/components/LandingFooter'
import { FigmaBadge } from '@/components/FigmaBadge'

export default function LandingPage() {
  const [typedText, setTypedText] = useState('')
  const [typingComplete, setTypingComplete] = useState(false)

  useEffect(() => {
    const fullText = 'Booting Zombify'

    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTypedText(fullText)
      setTypingComplete(true)
      return
    }

    let currentIndex = 0
    const interval = window.setInterval(() => {
      currentIndex += 1
      setTypedText(fullText.slice(0, currentIndex))
      if (currentIndex >= fullText.length) {
        clearInterval(interval)
        setTypingComplete(true)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [])


  return (
    <div className="min-h-screen bg-[#f5f1e6] text-black font-mono relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-gradient-to-b from-transparent via-black to-transparent bg-[length:100%_4px]" />

      <LandingHeader />

      <div className="relative z-10 min-h-screen flex flex-col items-center px-6 pt-24 md:pt-28">
        <div className="mb-10 select-none flex justify-center ascii-container">
          <GlitchArt className="text-[4px] leading-[1] opacity-20 font-mono whitespace-pre pointer-events-none ascii-original transition-opacity duration-[2000ms] ease-out" intensity="low" mask={{ rowStart: 0.28, rowEnd: 0.70, colStart: 0.32, colEnd: 0.68 }} randomSpots={3} spotSize={{ row: 0.08, col: 0.06 }}>
{`                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                          %%#%%@                                                                    
                       %##+--=++**######%%##%                                                       
                    %##+-:::::::::::::--==++*#######%%%@                                            
                 %##=::::::::::::::::::::::::::::::-=+*######%%%@                                   
              %#*-....:::::::::::::::::::::::::::::::::::::::-==+**#####%%%%%%                     
             @#-...................::::::::::::::::::::::::::::::::::::--==+*#@@                   
             @#-.:::::::::::::...............::::::::::::::::::::::::::::::-+*@@                   
             %#-.:::----:::::::::::::::::...............::::::::::::::::-++++*@@%%%%%@             
             %#-.::=+#%##*++====---::::::::::::::::::...............:-=++++++*@+:-=+*@@            
             %#-.::=+@@@@@@@@@@@@%#**+=+====--:::::::::::::::::::...:=*++++++*@+-++++@@            
             %#-.::=+%@@@@@@@@@@@@@@@@@@@@@@%#**++++===--:::::::::::-+#++++++*@#+++++@@            
             %#-.::=+%@@@@@@@@@@@@@@@@%%@@@@@@@@@@@@@@@@%%#**+==::::-+#++++++*@#+++++@@            
             %#-.::=+@@@@@@@@@@@@%*+:....-@@%+=+%@@@@@@@@@@@@@@#..::-+*++++++*@#+++++@@            
             %#-.::=+%@@@@@@@@@#:.........@*:....:-=*@@@@@@@@@@#..::-+*++++++*@#+++++@@            
             %#-.::=+%@@@@@@@@%*=:::::..:-@*:--::.::=%@@@@@@@@@#..::-+*++++++*@#+++++@@            
              #-.::=+@@@@@@@@#-..........:%+--::.....:*@@@@@@@@#..::-+*++++++*@#+++++@@            
             %#-.::=+@@@@@@@%+-.::::--:-::%-.........:=#@@@@@@@#..::-+*++++++*@#+++++@@            
             %#-.::=+%@@@@@@%=:...:::.-=..%=..:-:.....:+@@@@@@@#..::-+*++++++*@#+++++@@            
             @#-.::=+%@@@@@%+---....::...-%-:-::..::::-*@@@@@@@#..::-+#++++++#@#+++++@@            
             @#-.::=+%@@@@%+-....-....:..:#=:::.:::.:..:=%@@@@@#..::-+*++++++*@#+++++@@            
             @#-.::=+@@@@@@%#-.....-:-...:#=...-:...--::=*%@@@@#..::-+*++++++*@#+++++@@            
             @#-.::=+@@@@@@@*-:-.......:::#=.:::-=++=:..-*%@@@@#..::-+*++++++*@#+++++@@            
             @#-.::=+@@@@@@@@#=:..:..:...:#=.........:----#@@@@#..::-+*++++++*@#+++++@@            
             @#-.::=+@@@@@@@@@%*:..::....:%+.:::::-==...+@@@@@@#..::-+*++++++*@#+++*%@@            
             @#-.::=+@@@@@@@@@@@%*-:::::.:%+:...:::..::=#@@@@@@#..::-+*++++++#@#+*@@@              
             @#-.::=+@@@@@@@@@@@@#-:....::@*-:.:.:..:-*@@@@@@@@#..::-+*++++++#@%@@@                
             @#-.::=+@@@@@@@@@@@@@@@#=-=+@@@+:..:--=#@@@@@@@@@@#..::-+*++++++#@@@                  
             %#-.::=+#@@@@@@@@@@@@@@@@@@@@@@@@@%@%@@@@@@@@@@@@@#..::-+*++++++#@%@@@@@@@@@          
             %#-.:::........-+#%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#..::-+*++++++#@*++++++**@@         
             %#-.::::::::::::........:-=+*#%@@@@@@@@@@@@@@@@@@@#..::-+*++++++#@*++++=-=+%@         
              %#=====--:::::::::::::::::........:--+#%@@@@@@@@@*..::-+*+++++*@@+++=-=+++%@         
                 @@@@@%#*++++==--:::::::::::::::::..........-+#+..::-+*+++*@@*++=-++++++%@         
              %%*=:-++++**#%%@@%%%#***+===---:::::::::::::::.....:::=+*+#@%*++==++++++++%@         
           %#*-::::::---==++*@@%#**+**##%%@%%#*++===--::::::::::::::=*@@#*++==++++++++++%@         
          %*...........:::::::::-+#@@@@@@%#*+++*#%@@@%#*++++==-::::-@@*++=-+++++++++++++%@         
          %*..:::::::............::::::::-+*#%%@@@@%##@@@%#%@%%%##*#*++=-+++++++++++++++%@         
          %*..::::::::::::::::::............::::::--=+++++++++++++++=-=++++++++++++++++#@@         
          %*..::::::::::::::::::::::::::::............::::::::--==--=++++++++++++++++%@@           
          %*..:::::::::::::::::::::::::::::::::::::.............:-++++++++++++++++*%@@             
          %*..::::::::::::::::::::::::::::::::===--:::::::::::..-+*+++++++++++++#@@@               
          %#:::::::::::::::::::::::::::::::::=*@@@%#*++*+=-:::::+**+++++++++++#@@                  
           @@##**++==----:::::::::::::::::::::.....-=*#%@@@*::::+**++++++++*%@@                    
             @@@@@@@@@%%#**+====---:::::::::::::::::::......::::+**++++++*@@@                      
                         @@@@@@@@%#*+=+++=--::::::::::::::::::::+**++++*@@@                        
                                  @@@@@@@@%##**++===---:::::::::+**++#@@@                          
                                           @@@@@@@@@%%##*+=====-+*#%@@                              
                                                       @@@@@@@@@%@@@                               
                                                                @@                                 
                                                                                                    
                                                                                                    
                                                                                                    `}
          </GlitchArt>
          <pre className="text-[4px] leading-[1] opacity-20 font-mono whitespace-pre pointer-events-none ascii-fragment left">
{`                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                          %%#%%@                                                                    
                       %##+--=++**######%%##%                                                       
                    %##+-:::::::::::::--==++*#######%%%@                                            
                 %##=::::::::::::::::::::::::::::::-=+*######%%%@                                   
              %#*-....:::::::::::::::::::::::::::::::::::::::-==+**#####%%%%%%                      
             @#-...................::::::::::::::::::::::::::::::::::::--==+*#@@                   
             @#-.:::::::::::::...............::::::::::::::::::::::::::::::-+*@@                   
             %#-.:::----:::::::::::::::::...............::::::::::::::::-++++*@@%%%%%@             
             %#-.::=+#%##*++====---::::::::::::::::::...............:-=++++++*@+:-=+*@@            
             %#-.::=+@@@@@@@@@@@@%#**+=+====--:::::::::::::::::::...:=*++++++*@+-++++@@            
             %#-.::=+%@@@@@@@@@@@@@@@@@@@@@@%#**++++===--:::::::::::-+#++++++*@#+++++@@            
             %#-.::=+%@@@@@@@@@@@@@@@@%%@@@@@@@@@@@@@@@@%%#**+==::::-+#++++++*@#+++++@@            
             %#-.::=+@@@@@@@@@@@@%*+:....-@@%+=+%@@@@@@@@@@@@@@#..::-+*++++++*@#+++++@@            
             %#-.::=+%@@@@@@@@@#:.........@*:....:-=*@@@@@@@@@@#..::-+*++++++*@#+++++@@            
             %#-.::=+%@@@@@@@@%*=:::::..:-@*:--::.::=%@@@@@@@@@#..::-+*++++++*@#+++++@@            
              #-.::=+@@@@@@@@#-..........:%+--::.....:*@@@@@@@@#..::-+*++++++*@#+++++@@            
             %#-.::=+@@@@@@@%+-.::::--:-::%-.........:=#@@@@@@@#..::-+*++++++*@#+++++@@            
             %#-.::=+%@@@@@@%=:...:::.-=..%=..:-:.....:+@@@@@@@#..::-+*++++++*@#+++++@@            
             @#-.::=+%@@@@@%+---....::...-%-:-::..::::-*@@@@@@@#..::-+#++++++#@#+++++@@            
             @#-.::=+%@@@@%+-....-....:..:#=:::.:::.:..:=%@@@@@#..::-+*++++++*@#+++++@@            
             @#-.::=+@@@@@@%#-.....-:-...:#=...-:...--::=*%@@@@#..::-+*++++++*@#+++++@@            
             @#-.::=+@@@@@@@*-:-.......:::#=.:::-=++=:..-*%@@@@#..::-+*++++++*@#+++++@@            
             @#-.::=+@@@@@@@@#=:..:..:...:#=.........:----#@@@@#..::-+*++++++*@#+++++@@            
             @#-.::=+@@@@@@@@@%*:..::....:%+.:::::-==...+@@@@@@#..::-+*++++++*@#+++*%@@            
             @#-.::=+@@@@@@@@@@@%*-:::::.:%+:...:::..::=#@@@@@@#..::-+*++++++#@#+*@@@              
             @#-.::=+@@@@@@@@@@@@#-:....::@*-:.:.:..:-*@@@@@@@@#..::-+*++++++#@%@@@               
             @#-.::=+@@@@@@@@@@@@@@@#=-=+@@@+:..:--=#@@@@@@@@@@#..::-+*++++++#@@@                  
             %#-.::=+#@@@@@@@@@@@@@@@@@@@@@@@@@%@%@@@@@@@@@@@@@#..::-+*++++++#@%@@@@@@@@@          
             %#-.:::........-+#%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#..::-+*++++++#@*++++++**@@         
             %#-.::::::::::::........:-=+*#%@@@@@@@@@@@@@@@@@@@#..::-+*++++++#@*++++=-=+%@         
              %#=====--:::::::::::::::::........:--+#%@@@@@@@@@*..::-+*+++++*@@+++=-=+++%@         
                 @@@@@%#*++++==--:::::::::::::::::..........-+#+..::-+*+++*@@*++=-++++++%@         
              %%*=:-++++**#%%@@%%%#***+===---:::::::::::::::.....:::=+*+#@%*++==++++++++%@         
           %#*-::::::---==++*@@%#**+**##%%@%%#*++===--::::::::::::::=*@@#*++==++++++++++%@         
          %*...........:::::::::-+#@@@@@@%#*+++*#%@@@%#*++++==-::::-@@*++=-+++++++++++++%@         
          %*..:::::::............::::::::-+*#%%@@@@%##@@@%#%@%%%##*#*++=-+++++++++++++++%@         
          %*..::::::::::::::::::............::::::--=+++++++++++++++=-=++++++++++++++++#@@         
          %*..::::::::::::::::::::::::::::............::::::::--==--=++++++++++++++++%@@           
          %*..:::::::::::::::::::::::::::::::::::::.............:-++++++++++++++++*%@@             
          %*..::::::::::::::::::::::::::::::::===--:::::::::::..-+*+++++++++++++#@@@               
          %#:::::::::::::::::::::::::::::::::=*@@@%#*++*+=-:::::+**+++++++++++#@@                  
           @@##**++==----:::::::::::::::::::::.....-=*#%@@@*::::+**++++++++*%@@                   
             @@@@@@@@@%%#**+====---:::::::::::::::::::......::::+**++++++*@@@                     
                         @@@@@@@@%#*+=+++=--::::::::::::::::::::+**++++*@@@                       
                                  @@@@@@@@%##**++===---:::::::::+**++#@@@                         
                                           @@@@@@@@@%%##*+=====-+*#%@@                            
                                                       @@@@@@@@@%@@@                              
                                                                @@                               
                                                                                                  
                                                                                                  
                                                                                                  `}
          </pre>
          <pre className="text-[4px] leading-[1] opacity-20 font-mono whitespace-pre pointer-events-none ascii-fragment right">
{`                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                          %%#%%@                                                                    
                       %##+--=++**######%%##%                                                       
                    %##+-:::::::::::::--==++*#######%%%@                                            
                 %##=::::::::::::::::::::::::::::::-=+*######%%%@                                   
              %#*-....:::::::::::::::::::::::::::::::::::::::-==+**#####%%%%%%                     
             @#-...................::::::::::::::::::::::::::::::::::::--==+*#@@                   
             @#-.:::::::::::::...............::::::::::::::::::::::::::::::-+*@@                   
             %#-.:::----:::::::::::::::::...............::::::::::::::::-++++*@@%%%%%@             
             %#-.::=+#%##*++====---::::::::::::::::::...............:-=++++++*@+:-=+*@@            
             %#-.::=+@@@@@@@@@@@@%#**+=+====--:::::::::::::::::::...:=*++++++*@+-++++@@            
             %#-.::=+%@@@@@@@@@@@@@@@@@@@@@@%#**++++===--:::::::::::-+#++++++*@#+++++@@            
             %#-.::=+%@@@@@@@@@@@@@@@@%%@@@@@@@@@@@@@@@@%%#**+==::::-+#++++++*@#+++++@@            
             %#-.::=+@@@@@@@@@@@@%*+:....-@@%+=+%@@@@@@@@@@@@@@#..::-+*++++++*@#+++++@@            
             %#-.::=+%@@@@@@@@@#:.........@*:....:-=*@@@@@@@@@@#..::-+*++++++*@#+++++@@            
             %#-.::=+%@@@@@@@@%*=:::::..:-@*:--::.::=%@@@@@@@@@#..::-+*++++++*@#+++++@@            
              #-.::=+@@@@@@@@#-..........:%+--::.....:*@@@@@@@@#..::-+*++++++*@#+++++@@            
             %#-.::=+@@@@@@@%+-.::::--:-::%-.........:=#@@@@@@@#..::-+*++++++*@#+++++@@            
             %#-.::=+%@@@@@@%=:...:::.-=..%=..:-:.....:+@@@@@@@#..::-+*++++++*@#+++++@@            
             @#-.::=+%@@@@@%+---....::...-%-:-::..::::-*@@@@@@@#..::-+#++++++#@#+++++@@            
             @#-.::=+%@@@@%+-....-....:..:#=:::.:::.:..:=%@@@@@#..::-+*++++++*@#+++++@@            
             @#-.::=+@@@@@@%#-.....-:-...:#=...-:...--::=*%@@@@#..::-+*++++++*@#+++++@@            
             @#-.::=+@@@@@@@*-:-.......:::#=.:::-=++=:..-*%@@@@#..::-+*++++++*@#+++++@@            
             @#-.::=+@@@@@@@@#=:..:..:...:#=.........:----#@@@@#..::-+*++++++*@#+++++@@            
             @#-.::=+@@@@@@@@@%*:..::....:%+.:::::-==...+@@@@@@#..::-+*++++++*@#+++*%@@            
             @#-.::=+@@@@@@@@@@@%*-:::::.:%+:...:::..::=#@@@@@@#..::-+*++++++#@#+*@@@              
             @#-.::=+@@@@@@@@@@@@#-:....::@*-:.:.:..:-*@@@@@@@@#..::-+*++++++#@%@@@                
             @#-.::=+@@@@@@@@@@@@@@@#=-=+@@@+:..:--=#@@@@@@@@@@#..::-+*++++++#@@@                  
             %#-.::=+#@@@@@@@@@@@@@@@@@@@@@@@@@%@%@@@@@@@@@@@@@#..::-+*++++++#@%@@@@@@@@@          
             %#-.:::........-+#%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#..::-+*++++++#@*++++++**@@         
             %#-.::::::::::::........:-=+*#%@@@@@@@@@@@@@@@@@@@#..::-+*++++++#@*++++=-=+%@         
              %#=====--:::::::::::::::::........:--+#%@@@@@@@@@*..::-+*+++++*@@+++=-=+++%@         
                 @@@@@%#*++++==--:::::::::::::::::..........-+#+..::-+*+++*@@*++=-++++++%@         
              %%*=:-++++**#%%@@%%%#***+===---:::::::::::::::.....:::=+*+#@%*++==++++++++%@         
           %#*-::::::---==++*@@%#**+**##%%@%%#*++===--::::::::::::::=*@@#*++==++++++++++%@         
          %*...........:::::::::-+#@@@@@@%#*+++*#%@@@%#*++++==-::::-@@*++=-+++++++++++++%@         
          %*..:::::::............::::::::-+*#%%@@@@%##@@@%#%@%%%##*#*++=-+++++++++++++++%@         
          %*..::::::::::::::::::............::::::--=+++++++++++++++=-=++++++++++++++++#@@         
          %*..::::::::::::::::::::::::::::............::::::::--==--=++++++++++++++++%@@           
          %*..:::::::::::::::::::::::::::::::::::::.............:-++++++++++++++++*%@@             
          %*..::::::::::::::::::::::::::::::::===--:::::::::::..-+*+++++++++++++#@@@               
          %#:::::::::::::::::::::::::::::::::=*@@@%#*++*+=-:::::+**+++++++++++#@@                  
           @@##**++==----:::::::::::::::::::::.....-=*#%@@@*::::+**++++++++*%@@                    
             @@@@@@@@@%%#**+====---:::::::::::::::::::......::::+**++++++*@@@                      
                         @@@@@@@@%#*+=+++=--::::::::::::::::::::+**++++*@@@                        
                                  @@@@@@@@%##**++===---:::::::::+**++#@@@                          
                                           @@@@@@@@@%%##*+=====-+*#%@@                              
                                                       @@@@@@@@@%@@@                               
                                                                @@                                 
                                                                                                    
                                                                                                    
                                                                                                    `}
          </pre>
        </div>

        <div className="text-center mb-16 md:mb-20 w-full">
          <h1 className="text-3xl font-light leading-tight font-mono">
            {typingComplete ? (
              <>
                Booting <GlitchTranslate baseText="Zombify" intensity="low" />
              </>
            ) : (
              typedText
            )}
            <span className="inline-block w-[14px] h-[0.9em] bg-black ml-[3px] animate-blink align-middle relative -top-[3px]"></span>
          </h1>
          <p className="mt-3 text-sm md:text-base opacity-70 font-mono">
            UI/UX analysis & feedback engine for today's distracted minds.
          </p>
          
          <div id="upload-zone" className="mt-[42px] w-full self-stretch max-w-none md:max-w-2xl mx-0 md:mx-auto px-0 sm:px-0">
            <GuestUploadZone />
            <p className="text-xs opacity-40 mt-3 text-center font-mono">
              Free one-time analysis • No signup required
            </p>
          </div>
          
          {/* Figma Integration Badge */}
          <div className="mt-6 flex justify-center">
            <FigmaBadge />
          </div>
        </div>

        {/* Intro paragraphs */}
        <div className="text-center space-y-6 mb-16 md:mb-20 px-0">
          <div className="max-w-2xl mx-auto space-y-4">
            <p className="text-lg opacity-70 leading-[1.75] font-mono">
              The attention economy has turned users into digital{' '}
              <GlitchText intensity="low">zombies</GlitchText>.
            </p>
            <p className="text-lg opacity-70 leading-[1.75] font-mono">
              <GlitchText intensity="low">Mindless scrolling</GlitchText>,{' '}
              <GlitchText intensity="low">autopilot browsing</GlitchText>{' '}and{' '}
              <GlitchText intensity="low">zero patience</GlitchText>{' '}for friction.
            </p>
            <p className="text-lg opacity-70 leading-[1.75] font-mono">
              Your design either works for today's{' '}
              <GlitchText intensity="low">scattered attention spans</GlitchText>{' '}
              or users{' '}<GlitchText intensity="low">abandon it instantly</GlitchText>.
            </p>
            <p className="text-lg opacity-70 leading-[1.75] font-mono">
              Zombify analyzes your UI and exposes the{' '}
              <GlitchText intensity="low">blind spots</GlitchText>,{' '}
              <GlitchText intensity="low">friction points</GlitchText>, and{' '}
              <GlitchText intensity="low">usability issues</GlitchText>{' '}
              that drive users away.
            </p>
          </div>
        </div>

        {/* Feature list */}
        <div className="w-full max-w-4xl mx-auto px-0 mb-24 md:mb-28">
          <ul className="w-full space-y-3 font-mono text-base max-w-2xl mx-auto">
            <li className="flex items-center gap-3 justify-start border border-black/20 px-3 md:px-4 py-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"></path>
              </svg>
              <span className="text-left">Score your designs on key UX metrics</span>
            </li>
            <li className="flex items-center gap-3 justify-start border border-black/20 px-3 md:px-4 py-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <span className="text-left">Find and fix confusing UX issues</span>
            </li>
            <li className="flex items-center gap-3 justify-start border border-black/20 px-3 md:px-4 py-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                <rect x="3" y="4" width="7" height="16" rx="1"></rect>
                <rect x="14" y="4" width="7" height="16" rx="1"></rect>
              </svg>
              <span className="text-left">A/B test and compare UI designs</span>
            </li>
            <li className="flex items-center gap-3 justify-start border border-black/20 px-3 md:px-4 py-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span className="text-left">Uncover dark UX patterns</span>
            </li>
            <li className="flex items-center gap-3 justify-start border border-black/20 px-3 md:px-4 py-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"></path>
              </svg>
              <span className="text-left">Get likely behavioural and usage insights</span>
            </li>
            <li className="flex items-center gap-3 justify-start border border-black/20 px-3 md:px-4 py-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                <path d="M21 15v4a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h10"></path>
                <path d="M17 3h4v4"></path>
                <path d="M16 8l5-5"></path>
              </svg>
              <span className="text-left">Refine UX copy and tone</span>
            </li>
            <li className="flex items-center gap-3 justify-start border border-black/20 px-3 md:px-4 py-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2z"></path>
                <line x1="12" y1="11" x2="12" y2="17"></line>
                <line x1="9" y1="14" x2="15" y2="14"></line>
              </svg>
              <span className="text-left flex-1">Create projects to improve and iterate on designs</span>
              <span className="ml-auto text-[10px] tracking-wider font-mono uppercase opacity-60">On Roadmap</span>
            </li>
          </ul>
        </div>

        

      </div>

      <LandingFooter />
    </div>
  )
}


