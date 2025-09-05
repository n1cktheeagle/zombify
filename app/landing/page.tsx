'use client';

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { track } from '@vercel/analytics'
import GlitchLogo from '@/components/GlitchLogo'
// Removed AuthButton for alpha waitlist landing

export default function LandingPage() {
  const [typedText, setTypedText] = useState('')
  const [showContent, setShowContent] = useState(true)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [utm, setUtm] = useState<{ utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string; utm_term?: string }>({})
  const [signupCount, setSignupCount] = useState<number | null>(null)
  const [website, setWebsite] = useState('') // honeypot
  const [cooldown, setCooldown] = useState(false)

  useEffect(() => {
    const fullText = 'Booting Zombify'

    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTypedText(fullText)
      return
    }

    let currentIndex = 0
    const interval = window.setInterval(() => {
      currentIndex += 1
      setTypedText(fullText.slice(0, currentIndex))
      if (currentIndex >= fullText.length) {
        clearInterval(interval)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const nextUtm: { [k: string]: string } = {}
    ;(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const).forEach((key) => {
      const v = params.get(key)
      if (v) nextUtm[key] = v
    })
    if (Object.keys(nextUtm).length > 0) setUtm(nextUtm)
  }, [])

  useEffect(() => {
    let cancelled = false
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/alpha', { method: 'GET', cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (!cancelled && typeof data?.count === 'number') setSignupCount(data.count)
      } catch {}
    }
    fetchCount()
    return () => { cancelled = true }
  }, [])

  const refreshCount = async () => {
    try {
      const res = await fetch('/api/alpha', { method: 'GET', cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (typeof data?.count === 'number') setSignupCount(data.count)
    } catch {}
  }

  const getTurnstileToken = async (): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      try {
        const t = (window as any).turnstile
        if (!t) return reject(new Error('Turnstile not ready'))
        const el = document.getElementById('cf-turnstile') as any
        if (!el) return reject(new Error('Turnstile element missing'))

        if (!el.__rendered) {
          const wid = t.render('#cf-turnstile', {
            sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!,
            size: 'invisible',
            retry: 'auto',
            callback: (token: string) => {
              el.__resolve?.(token)
              el.__resolve = undefined
            }
          })
          el.__wid = wid
          el.__rendered = true
        }

        if (el.__wid) t.reset(el.__wid)
        el.__resolve = resolve
        t.execute(el.__wid)
      } catch (e) {
        reject(e as any)
      }
    })
  }

  const validateEmail = (value: string) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(value)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.')
      return
    }
    // Honeypot
    if (website && website.trim().length > 0) {
      setError('Please remove unexpected text and try again.')
      return
    }
    // Consent is assumed true by default

    setLoading(true)
    try {
      let turnstileToken: string
      try {
        turnstileToken = await getTurnstileToken()
      } catch {
        setLoading(false)
        setError('Please complete the verification and try again.')
        return
      }

      const payload = { email, consent: true, source: 'zombify-landing', turnstileToken, website }

      const res = await fetch('/api/alpha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok && res.status !== 202) {
        throw new Error(data?.error || 'Failed to sign up. Please try again later.')
      }
      if (res.status === 202) {
        setSuccess("You're already on the list.")
        setEmail('')
        // no tracking, no count refresh for idempotent case
        setCooldown(true)
        setTimeout(() => setCooldown(false), 3000)
        return
      }
      if (data?.ok && res.status === 200) {
        try {
          track('alpha_signup', {
            source: 'zombify-landing',
            utm_source: utm.utm_source ?? '',
            utm_medium: utm.utm_medium ?? '',
            utm_campaign: utm.utm_campaign ?? '',
            utm_content: utm.utm_content ?? '',
            utm_term: utm.utm_term ?? '',
            referrer: typeof document !== 'undefined' ? (document.referrer || '') : '',
          })
        } catch {}
        await refreshCount()
        setSuccess('Thanks! You\'re on the list. We\'ll be in touch soon.')
        setEmail('')
        setCooldown(true)
        setTimeout(() => setCooldown(false), 3000)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to sign up. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f1e6] text-black font-mono relative overflow-x-hidden">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-gradient-to-b from-transparent via-black to-transparent bg-[length:100%_4px]" />

      <nav className="fixed top-0 left-0 right-0 z-50 flex flex-nowrap items-center justify-between px-6 py-4">
        <GlitchLogo onClick={() => {}} className="text-xl" />
        <div className="flex items-center gap-4">
          <a href="https://discord.gg/ynDpjDeRTr" aria-label="Discord" className="opacity-70 hover:opacity-100 transition-opacity font-mono text-sm">discord</a>
          <a href="mailto:hi@zombify.ai" aria-label="Email" className="opacity-70 hover:opacity-100 transition-opacity font-mono text-sm">email</a>
        </div>
      </nav>

      <div className="relative z-10 min-h-screen flex flex-col items-center px-6 pt-24 md:pt-28">
        <div className="mb-20 select-none flex justify-center cursor-pointer ascii-container">
          <pre className="text-[4px] leading-[1] opacity-20 font-mono whitespace-pre pointer-events-none ascii-original transition-opacity duration-[2000ms] ease-out">
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
            {typedText}<span className="inline-block w-[14px] h-[0.9em] bg-black ml-[3px] animate-blink align-middle relative -top-[3px]"></span>
          </h1>
          <p className="mt-3 text-sm md:text-base opacity-70 font-mono">
            Ensure your UI works for modern-day <span className="line-through">users</span> zombies.
          </p>
          <div id="waitlist" className="mt-12 md:mt-16 w-full self-stretch max-w-none md:max-w-2xl mx-0 md:mx-auto px-0 sm:px-0">
            <div className="zombify-card w-full px-3 md:px-6 py-5 border border-black/20 rounded-none bg-white/70 backdrop-blur-sm text-left">
              <form onSubmit={onSubmit} className="space-y-3 w-full">
                <p className="text-sm font-medium">Get notified when the alpha is live. No spam.</p>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 sm:gap-0 items-end w-full">
                  <div className="w-full">
                    <label htmlFor="email" className="sr-only">Email Address</label>
                    {/* Honeypot field to catch bots */}
                    <input type="text" name="website" autoComplete="off" tabIndex={-1} className="hidden" aria-hidden="true" value={website} onChange={(e)=>setWebsite(e.target.value)} />
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      className="w-full h-10 px-3 border border-gray-300 rounded-none focus:outline-none focus:ring-0 focus:border-black text-sm placeholder-black/60"
                    />
                  </div>
                  <div className="w-full">
                    <div className="relative">
                      {/* Invisible Turnstile placeholder (positioned above button if visible fallback) */}
                      <div
                        id="cf-turnstile"
                        className="cf-turnstile absolute left-0 bottom-full mb-2 w-full flex justify-center"
                        data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string}
                        data-retry="auto"
                      />
                      <button
                        type="submit"
                        disabled={loading || cooldown}
                        className={`zombify-primary-button h-10 w-full sm:w-auto inline-flex items-center justify-center px-6 text-sm font-bold tracking-wide whitespace-nowrap rounded-none sm:border-l-0 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {loading ? 'SENDING...' : 'NOTIFY ME'}
                      </button>
                    </div>
                  </div>
                </div>
                {(success || error) && (
                  <div>
                    {success && <span className="text-green-600 text-sm">{success}</span>}
                    {error && <span className="text-red-600 text-sm">{error}</span>}
                  </div>
                )}
                {signupCount !== null && (
                  <p className="text-left font-mono text-xs opacity-70 mt-2">{signupCount.toLocaleString()} people waiting</p>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Intro paragraph above waitlist */}
        <div className="text-center space-y-6 mb-16 md:mb-20 px-0">
          <div className="max-w-2xl mx-auto space-y-4">
            <p className="text-lg opacity-70 leading-[1.75] font-mono">
              People are changing. Glued to screens, endlessly scrolling… attention spans are collapsing. We use products in a sleep-like zombie trance, on autopilot. Zombify helps your UI survive this era, exposing blind spots, friction points, misaligned intent, shady patterns, and missed opportunities. Uncover the flaws you don’t see.
            </p>
          </div>
        </div>

        {/* Removed duplicated waitlist block below since it's moved into hero */}

        {/* Feature list below waitlist (no boxes) */}
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
              <span className="text-left">Create projects to improve and iterate on designs</span>
            </li>
          </ul>
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('waitlist');
                if (el) {
                  const rect = el.getBoundingClientRect();
                  const absoluteTop = rect.top + window.pageYOffset;
                  const offset = absoluteTop - (window.innerHeight / 2) + (rect.height / 2);
                  window.scrollTo({ top: offset, behavior: 'smooth' });
                }
              }}
              className="zombify-primary-button w-full sm:w-auto px-6 py-2 text-sm font-bold tracking-wide"
            >
              NOTIFY ME
            </button>
          </div>
        </div>

        

      </div>

      <footer className="border-t border-black/10 py-8 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-6 mb-4">
            <a href="https://discord.gg/ynDpjDeRTr" className="opacity-60 hover:opacity-100 transition-opacity">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.25A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.046-.32 13.41.099 17.731a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
              </svg>
            </a>
            <a href="mailto:hi@zombify.ai" className="opacity-60 hover:opacity-100 transition-opacity">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                <path d="m22 7-10 5L2 7"></path>
              </svg>
            </a>
          </div>
          <p className="text-sm font-mono opacity-60">
            Designed with 0 figma files. Built for the era of collapsing attention.
          </p>
          <p className="text-xs font-mono opacity-60 mt-1">© 2025 Zombify. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  )
}


