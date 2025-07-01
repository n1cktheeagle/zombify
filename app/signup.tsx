"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { ArrowRight, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

type SignupStep = "create" | "verify" | "success"

export default function SignupFlow() {
  const [step, setStep] = useState<SignupStep>("create")
  const [email, setEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)

  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Auto-focus next input on code entry
  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return // Prevent multiple characters

    const newCode = [...verificationCode]
    newCode[index] = value
    setVerificationCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus()
    }
  }

  // Handle backspace in code inputs
  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus()
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    setStep("verify")
    setResendCooldown(30)
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    // Simulate Google OAuth
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsLoading(false)
    setShowSuccess(true)
    setTimeout(() => {
      // Redirect to dashboard
      window.location.href = "/dashboard"
    }, 2000)
  }

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = verificationCode.join("")
    if (code.length !== 6) return

    setIsLoading(true)
    // Simulate verification
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    setStep("success")
    setShowSuccess(true)

    setTimeout(() => {
      // Redirect to dashboard
      window.location.href = "/dashboard"
    }, 2500)
  }

  const handleResendCode = async () => {
    if (resendCooldown > 0) return

    setIsLoading(true)
    // Simulate resend
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    setResendCooldown(30)
  }

  const handleChangeEmail = () => {
    setStep("create")
    setVerificationCode(["", "", "", "", "", ""])
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[#f5f1e6] text-black font-mono flex items-center justify-center">
        <div className="text-center space-y-6 access-granted">
          <div className="text-6xl font-bold glitch-text-success tracking-wider">ACCESS</div>
          <div className="text-6xl font-bold glitch-text-success tracking-wider">GRANTED</div>
          <div className="w-16 h-1 bg-[#6b7c32] mx-auto animate-pulse" />
          <p className="text-sm opacity-70 font-mono">Initializing your undead workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f1e6] text-black font-mono relative">
      {/* Header */}
      <header className="border-b border-black/10 bg-[#f5f1e6]/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold tracking-tight logo-glitch uppercase" data-text="ZOMBIFY">
              ZOMBIFY
              <span className="japanese-text">目を覚ませ</span>
            </div>
            <div className="w-2 h-2 bg-[#8b0000] rounded-full animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="zombify-ghost-button">
              Log In
            </Button>
            <Button size="sm" className="zombify-primary-button">
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-16">
        {step === "create" && (
          <div className="space-y-8 fade-in">
            {/* Title Section */}
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold leading-tight font-serif italic">Your designs deserve memory.</h1>
              <p className="text-lg opacity-70 leading-relaxed">
                Create an account to save your uploads, build feedback chains, and track your evolution.
              </p>
            </div>

            {/* Signup Options */}
            <Card className="zombify-card">
              <CardContent className="p-8 space-y-6">
                {/* Google Sign-In */}
                <Button onClick={handleGoogleSignIn} disabled={isLoading} className="zombify-google-button w-full h-12">
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      <span>Connecting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </div>
                  )}
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-black/10" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-[#f5f1e6] px-4 text-black/60 font-mono">or</span>
                  </div>
                </div>

                {/* Email Form */}
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium opacity-70 uppercase tracking-wide">
                      Email address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="zombify-input h-12"
                    />
                  </div>

                  <Button type="submit" disabled={!email || isLoading} className="zombify-primary-button w-full h-12">
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Sending...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Next</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm opacity-60">
                Already have an account?{" "}
                <a href="/login" className="zombify-link">
                  Log in
                </a>
              </p>
            </div>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-8 fade-in">
            {/* Title Section */}
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold font-serif italic">Verify Yourself</h1>
              <p className="text-lg opacity-70">
                We sent a 6-digit code to{" "}
                <span className="font-mono text-sm bg-black/5 px-2 py-1 rounded">{email}</span>
              </p>
            </div>

            {/* Verification Form */}
            <Card className="zombify-card">
              <CardContent className="p-8 space-y-6">
                <form onSubmit={handleVerificationSubmit} className="space-y-6">
                  {/* Code Input */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium opacity-70 uppercase tracking-wide">Verification Code</label>
                    <div className="flex gap-2 justify-center">
                      {verificationCode.map((digit, index) => (
                        <Input
                          key={index}
                          ref={(el) => (codeInputRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleCodeChange(index, e.target.value)}
                          onKeyDown={(e) => handleCodeKeyDown(index, e)}
                          className="zombify-code-input w-12 h-12 text-center text-lg font-mono"
                        />
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={verificationCode.join("").length !== 6 || isLoading}
                    className="zombify-primary-button w-full h-12"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </form>

                {/* Actions */}
                <div className="flex flex-col gap-3 pt-4 border-t border-black/10">
                  <Button
                    variant="ghost"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || isLoading}
                    className="zombify-ghost-button text-sm"
                  >
                    {resendCooldown > 0 ? (
                      `Resend code in ${resendCooldown}s`
                    ) : (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Resend Code
                      </div>
                    )}
                  </Button>

                  <Button variant="ghost" onClick={handleChangeEmail} className="zombify-ghost-button text-sm">
                    Change Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
