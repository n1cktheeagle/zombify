'use client';

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { track } from '@vercel/analytics'
import { getAttrForInsert } from '@/lib/utm'
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

      const attr = getAttrForInsert()
      // Fallback: derive from current URL if localStorage empty
      let fb_source: string | null = null
      let fb_medium: string | null = null
      let fb_campaign: string | null = null
      let fb_content: string | null = null
      let fb_term: string | null = null
      let fb_referrer: string | null = null
      if (typeof window !== 'undefined') {
        const p = new URLSearchParams(window.location.search)
        fb_source = p.get('utm_source') || p.get('source')
        fb_medium = p.get('utm_medium') || p.get('medium')
        fb_campaign = p.get('utm_campaign') || p.get('campaign')
        fb_content = p.get('utm_content') || p.get('content')
        fb_term = p.get('utm_term') || p.get('term')
        const refP = p.get('referrer') || p.get('ref')
        fb_referrer = refP || (typeof document !== 'undefined' ? (document.referrer || null) : null)
        // Normalize empties
        fb_source = fb_source && fb_source.trim() ? fb_source : null
        fb_medium = fb_medium && fb_medium.trim() ? fb_medium : null
        fb_campaign = fb_campaign && fb_campaign.trim() ? fb_campaign : null
        fb_content = fb_content && fb_content.trim() ? fb_content : null
        fb_term = fb_term && fb_term.trim() ? fb_term : null
        fb_referrer = fb_referrer && fb_referrer.trim() ? fb_referrer : null
      }
      const final_source = attr.source ?? fb_source ?? null
      const final_medium = attr.medium ?? fb_medium ?? null
      const final_campaign = attr.campaign ?? fb_campaign ?? null
      const final_content = attr.content ?? fb_content ?? null
      const final_term = attr.term ?? fb_term ?? null
      const final_referrer = attr.referrer ?? fb_referrer ?? null
      const payload = {
        email,
        consent: true,
        source: 'zombify-landing',
        turnstileToken,
        website,
        // send both utm_* and plain fields for compatibility
        utm_source: final_source,
        utm_medium: final_medium,
        utm_campaign: final_campaign,
        utm_content: final_content,
        utm_term: final_term,
        utm_referrer: final_referrer,
        medium: final_medium,
        campaign: final_campaign,
        content: final_content,
        term: final_term,
        referrer: final_referrer,
      }

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

        {/* Intro paragraph above waitlist */}
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
        </div>

        

      </div>

      <LandingFooter />
    </div>
  )
}


