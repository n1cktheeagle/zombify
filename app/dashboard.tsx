"use client"

import type React from "react"

import { useState, useCallback } from "react"
import {
  Upload,
  Eye,
  TrendingUp,
  Calendar,
  Target,
  Palette,
  MoreHorizontal,
  Crown,
  Lock,
  CircleIcon as Chain,
  ChevronLeft,
  Download,
  MousePointer,
  Layers,
  Settings,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

type DashboardView = "main" | "report" | "processing"

interface ActivityItem {
  id: string
  projectName: string
  timestamp: string
  gripScore: number
  topIssue: string
  preview: string
  file?: File
}

export default function ZombifyDashboard() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [currentView, setCurrentView] = useState<DashboardView>("main")
  const [selectedReport, setSelectedReport] = useState<ActivityItem | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [sidebarTab, setSidebarTab] = useState<"recents" | "projects">("recents")
  const [mainTab, setMainTab] = useState<"uploads" | "trends">("uploads")

  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([
    {
      id: "1",
      projectName: "E-commerce Checkout",
      timestamp: "2 hours ago",
      gripScore: 78,
      topIssue: "CTA button contrast too low",
      preview: "/placeholder.svg?height=80&width=120",
    },
    {
      id: "2",
      projectName: "Landing Page Hero",
      timestamp: "1 day ago",
      gripScore: 65,
      topIssue: "Visual hierarchy unclear",
      preview: "/placeholder.svg?height=80&width=120",
    },
  ])

  const projects = [
    {
      id: "1",
      name: "E-commerce Checkout",
      chainLength: 5,
      lastScore: 78,
      lastUpdated: "2 hours ago",
      preview: "/placeholder.svg?height=60&width=80",
    },
    {
      id: "2",
      name: "Landing Page Hero",
      chainLength: 3,
      lastScore: 65,
      lastUpdated: "1 day ago",
      preview: "/placeholder.svg?height=60&width=80",
    },
    {
      id: "3",
      name: "Mobile App Onboarding",
      chainLength: 7,
      lastScore: 82,
      lastUpdated: "3 days ago",
      preview: "/placeholder.svg?height=60&width=80",
    },
  ]

  const feedbackCards = [
    {
      id: 1,
      category: "CTA Clarity",
      icon: Target,
      title: "Your primary button fades into the void",
      description:
        "The checkout button lacks sufficient contrast against the background, making it nearly invisible to users scanning the page.",
      zombieTip: "Undead eyes crave bold contrasts. Your CTA should rise from the grave, not hide in it.",
      severity: "Critical",
    },
    {
      id: 2,
      category: "Visual Hierarchy",
      icon: Layers,
      title: "Information fights for attention",
      description:
        "Multiple elements compete for primary focus, creating visual chaos that confuses the user's journey through your interface.",
      zombieTip: "Like a well-organized graveyard, each element needs its proper place in the hierarchy.",
      severity: "High",
    },
    {
      id: 3,
      category: "Touch Targets",
      icon: MousePointer,
      title: "Buttons too small for mortal fingers",
      description:
        "Several interactive elements fall below the 44px minimum touch target size, creating frustration on mobile devices.",
      zombieTip: "Even zombie fingers need room to tap. Size matters in the afterlife.",
      severity: "High",
    },
  ]

  const processFile = async (file: File) => {
    setCurrentView("processing")
    setUploadProgress(0)

    // Simulate processing with progress updates
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval)
          return 95
        }
        return prev + Math.random() * 15
      })
    }, 200)

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 3000))
    clearInterval(progressInterval)
    setUploadProgress(100)

    // Create new activity item
    const newActivity: ActivityItem = {
      id: Date.now().toString(),
      projectName: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
      timestamp: "Just now",
      gripScore: Math.floor(Math.random() * 40) + 60, // Random score 60-100
      topIssue: "Processing complete - view full report",
      preview: URL.createObjectURL(file),
      file,
    }

    // Add to recent activity
    setRecentActivity((prev) => [newActivity, ...prev])
    setSelectedReport(newActivity)

    // Show report
    setTimeout(() => {
      setCurrentView("report")
    }, 500)
  }

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFile(files[0])
    }
  }

  const handleViewReport = (activity: ActivityItem) => {
    setSelectedReport(activity)
    setCurrentView("report")
  }

  const handleBackToDashboard = () => {
    setCurrentView("main")
    setSelectedReport(null)
  }

  const handleLogoHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const logoElement = e.currentTarget
    const rect = logoElement.getBoundingClientRect()
    const japaneseText = logoElement.querySelector(".japanese-text") as HTMLElement

    if (japaneseText) {
      japaneseText.style.left = `${rect.left + rect.width / 2}px`
      japaneseText.style.top = `${rect.bottom + 2}px`
      japaneseText.style.transform = "translateX(-50%)"
    }

    // Add glitch class
    logoElement.classList.add("glitch-active")

    // Remove glitch class after 400ms
    setTimeout(() => {
      logoElement.classList.remove("glitch-active")
    }, 400)
  }

  if (currentView === "processing") {
    return (
      <div className="min-h-screen bg-[#f5f1e8] text-black font-mono flex items-center justify-center">
        {/* Subtle scanlines overlay */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-gradient-to-b from-transparent via-black to-transparent bg-[length:100%_4px]" />

        <div className="text-center space-y-8 max-w-md">
          <div className="space-y-4">
            <div className="text-2xl font-bold glitch-text">ANALYZING UI</div>
            <div className="w-64 mx-auto">
              <Progress value={uploadProgress} className="h-2" />
            </div>
            <p className="text-sm opacity-60">
              {uploadProgress < 30 && "Scanning visual hierarchy..."}
              {uploadProgress >= 30 && uploadProgress < 60 && "Analyzing color contrast..."}
              {uploadProgress >= 60 && uploadProgress < 90 && "Checking accessibility..."}
              {uploadProgress >= 90 && "Generating undead insights..."}
            </p>
          </div>

          {/* Zombie Progress Indicator */}
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
      </div>
    )
  }

  if (currentView === "report" && selectedReport) {
    return (
      <div className="min-h-screen bg-[#f5f1e8] text-black font-mono">
        {/* Subtle scanlines overlay */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-gradient-to-b from-transparent via-black to-transparent bg-[length:100%_4px]" />

        {/* Header */}
        <header className="border-b border-black/10 bg-[#f5f1e8]/90 backdrop-blur-sm sticky top-0 z-50">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="text-2xl font-bold tracking-tight logo-glitch relative"
                data-text="ZOMBIFY"
                onMouseEnter={handleLogoHover}
              >
                ZOMBIFY
                <span className="japanese-text">目を覚ませ</span>
              </div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" className="bg-yellow-600 text-white hover:bg-yellow-700">
                <Crown className="w-4 h-4 mr-2" />
                Get Pro
              </Button>
              <div className="relative group">
                <Button variant="ghost" size="sm" className="zombify-ghost-button">
                  user@example.com
                </Button>
                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-black/20 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <button className="w-full px-4 py-2 text-left text-sm hover:bg-black/5 transition-colors flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Account Settings
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm hover:bg-black/5 transition-colors flex items-center gap-2 text-red-600">
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content below header */}
        <div className="flex">
          {/* Left Sidebar */}
          <aside className="w-80 bg-[#f5f1e8] border-r border-black/10 flex flex-col">
            {/* Tabs */}
            <div className="border-b border-black/10">
              <div className="flex">
                <button
                  onClick={() => setSidebarTab("recents")}
                  className={`flex-1 px-6 py-3 text-sm font-medium transition-all duration-200 ${
                    sidebarTab === "recents"
                      ? "bg-white/50 border-b-2 border-black text-black"
                      : "text-black/60 hover:text-black/80 hover:bg-black/5"
                  }`}
                >
                  Recents
                </button>
                <button
                  onClick={() => setSidebarTab("projects")}
                  className={`flex-1 px-6 py-3 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    sidebarTab === "projects"
                      ? "bg-white/50 border-b-2 border-black text-black"
                      : "text-black/60 hover:text-black/80 hover:bg-black/5"
                  }`}
                >
                  Projects
                  <Lock className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-6 space-y-4">
              {sidebarTab === "recents" && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium opacity-70">RECENT UPLOADS</h2>
                    <Calendar className="w-4 h-4 opacity-30" />
                  </div>

                  <div className="space-y-3">
                    {recentActivity.slice(0, 5).map((activity) => (
                      <div
                        key={activity.id}
                        className={`group p-4 rounded-lg border transition-all duration-200 cursor-pointer glitch-card ${
                          selectedReport?.id === activity.id
                            ? "border-black/40 bg-white/70"
                            : "border-black/10 bg-white/30 hover:bg-white/50"
                        }`}
                        onClick={() => handleViewReport(activity)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-medium text-sm leading-tight">{activity.projectName}</h3>
                            <p className="text-xs opacity-60 mt-1">{activity.timestamp}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold glitch-text">{activity.gripScore}</div>
                            <p className="text-xs opacity-60">Score</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={activity.preview || "/placeholder.svg"}
                              alt={activity.projectName}
                              className="w-8 h-6 rounded border border-black/10 object-cover"
                            />
                            <span className="text-xs opacity-60">
                              {selectedReport?.id === activity.id ? "Current" : "View Report"}
                            </span>
                          </div>
                          <Eye
                            className={`w-4 h-4 transition-opacity ${
                              selectedReport?.id === activity.id ? "opacity-60" : "opacity-0 group-hover:opacity-60"
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {sidebarTab === "projects" && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium opacity-70">PROJECTS</h2>
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-600" />
                      <Lock className="w-4 h-4 opacity-30" />
                    </div>
                  </div>

                  {/* Pro Feature Overlay */}
                  <div className="relative">
                    <div className="space-y-3 blur-sm opacity-50">
                      {projects.map((project) => (
                        <div
                          key={project.id}
                          className="group p-4 rounded-lg border border-black/10 bg-white/30 hover:bg-white/50 transition-all duration-200 cursor-pointer glitch-card"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-medium text-sm leading-tight">{project.name}</h3>
                              <p className="text-xs opacity-60 mt-1">{project.lastUpdated}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                <Chain className="w-3 h-3 mr-1" />+{project.chainLength}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img
                                src={project.preview || "/placeholder.svg"}
                                alt={project.name}
                                className="w-8 h-6 rounded border border-black/10 object-cover"
                              />
                              <span className="text-xs font-medium">Score: {project.lastScore}</span>
                            </div>
                            <MoreHorizontal className="w-4 h-4 opacity-0 group-hover:opacity-60 transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center space-y-3 bg-[#f5f1e8] p-4 rounded-lg border border-black/20 shadow-lg">
                        <Lock className="w-8 h-8 mx-auto opacity-60" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Pro Feature</p>
                          <p className="text-xs opacity-70">Organize uploads into projects</p>
                        </div>
                        <Button size="sm" className="bg-yellow-600 text-white hover:bg-yellow-700 text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          Upgrade
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <main className="flex-1 px-6 py-8 space-y-8 overflow-y-auto">
              {/* Project Header */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="sm" onClick={handleBackToDashboard}>
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                      </Button>
                    </div>
                    <h1 className="text-2xl font-bold">{selectedReport.projectName}</h1>
                    <p className="text-sm opacity-60">Uploaded {selectedReport.timestamp}</p>
                  </div>
                </div>

                {/* Image Preview and Score */}
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1">
                    <Card className="border-black/10 bg-white/50 backdrop-blur-sm">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">Original Design</h3>
                          </div>
                          <div className="aspect-[4/3] bg-gray-100 rounded-lg border border-black/10 overflow-hidden">
                            <img
                              src={selectedReport.preview || "/placeholder.svg"}
                              alt="UI Screenshot"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-xs opacity-60">Uploaded {selectedReport.timestamp}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Grip Score Summary */}
                  <div className="lg:col-span-2">
                    <Card className="border-black/10 bg-white/50 backdrop-blur-sm">
                      <CardContent className="p-6">
                        <div className="text-center space-y-4">
                          <div className="space-y-2">
                            <h2 className="text-lg font-medium opacity-70">Grip Score</h2>
                            <div className="text-6xl font-bold glitch-text">{selectedReport.gripScore}</div>
                            <p className="text-sm opacity-60">Your UI's hold on user attention</p>
                          </div>

                          {/* Progress Bar */}
                          <div className="max-w-md mx-auto space-y-2">
                            <div className="flex justify-between text-xs opacity-60">
                              <span>DEAD</span>
                              <span>UNDEAD</span>
                              <span>ALIVE</span>
                            </div>
                            <div className="relative h-3 bg-black/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-green-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${selectedReport.gripScore}%` }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              {/* Feedback Cards */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Undead Insights</h2>
                <div className="grid lg:grid-cols-2 gap-6">
                  {feedbackCards.map((card) => (
                    <Card
                      key={card.id}
                      className="border-black/10 bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-300"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 border border-black/20 rounded-lg flex items-center justify-center">
                              <card.icon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm opacity-60">{card.category}</p>
                              <CardTitle className="text-lg leading-tight">{card.title}</CardTitle>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              card.severity === "Critical"
                                ? "border-red-300 text-red-700"
                                : card.severity === "High"
                                  ? "border-orange-300 text-orange-700"
                                  : "border-yellow-300 text-yellow-700"
                            }
                          >
                            {card.severity}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm leading-relaxed opacity-80">{card.description}</p>
                        <div className="p-3 bg-black/5 rounded-lg border-l-4 border-red-300">
                          <p className="text-sm italic opacity-70">💀 {card.zombieTip}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="border-t border-black/10 pt-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Button className="bg-black text-white hover:bg-black/80">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Next Version
                    </Button>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download Report
                    </Button>
                  </div>
                  <Button onClick={handleBackToDashboard} variant="outline">
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-black font-mono">
      {/* Subtle scanlines overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-gradient-to-b from-transparent via-black to-transparent bg-[length:100%_4px]" />

      {/* Header */}
      <header className="border-b border-black/10 bg-[#f5f1e8]/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="text-2xl font-bold tracking-tight logo-glitch relative"
              data-text="ZOMBIFY"
              onMouseEnter={handleLogoHover}
            >
              ZOMBIFY
              <span className="japanese-text">目を覚ませ</span>
            </div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" className="bg-yellow-600 text-white hover:bg-yellow-700">
              <Crown className="w-4 h-4 mr-2" />
              Get Pro
            </Button>
            <div className="relative group">
              <Button variant="ghost" size="sm" className="zombify-ghost-button">
                user@example.com
              </Button>
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-black/20 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-black/5 transition-colors flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Account Settings
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-black/5 transition-colors flex items-center gap-2 text-red-600">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left Sidebar */}
        <aside className="w-80 bg-[#f5f1e8] border-r border-black/10 flex flex-col">
          {/* Tabs */}
          <div className="border-b border-black/10">
            <div className="flex">
              <button
                onClick={() => setSidebarTab("recents")}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-all duration-200 ${
                  sidebarTab === "recents"
                    ? "bg-white/50 border-b-2 border-black text-black"
                    : "text-black/60 hover:text-black/80 hover:bg-black/5"
                }`}
              >
                Recents
              </button>
              <button
                onClick={() => setSidebarTab("projects")}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  sidebarTab === "projects"
                    ? "bg-white/50 border-b-2 border-black text-black"
                    : "text-black/60 hover:text-black/80 hover:bg-black/5"
                }`}
              >
                Projects
                <Lock className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6 space-y-4">
            {sidebarTab === "recents" && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium opacity-70">RECENT UPLOADS</h2>
                  <Calendar className="w-4 h-4 opacity-30" />
                </div>

                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div
                      key={activity.id}
                      className="group p-4 rounded-lg border border-black/10 bg-white/30 hover:bg-white/50 transition-all duration-200 cursor-pointer glitch-card"
                      onClick={() => handleViewReport(activity)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-sm leading-tight">{activity.projectName}</h3>
                          <p className="text-xs opacity-60 mt-1">{activity.timestamp}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold glitch-text">{activity.gripScore}</div>
                          <p className="text-xs opacity-60">Score</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={activity.preview || "/placeholder.svg"}
                            alt={activity.projectName}
                            className="w-8 h-6 rounded border border-black/10 object-cover"
                          />
                          <span className="text-xs opacity-60">View Report</span>
                        </div>
                        <Eye className="w-4 h-4 opacity-0 group-hover:opacity-60 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {sidebarTab === "projects" && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium opacity-70">PROJECTS</h2>
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-yellow-600" />
                    <Lock className="w-4 h-4 opacity-30" />
                  </div>
                </div>

                {/* Pro Feature Overlay */}
                <div className="relative">
                  <div className="space-y-3 blur-sm opacity-50">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="group p-4 rounded-lg border border-black/10 bg-white/30 hover:bg-white/50 transition-all duration-200 cursor-pointer glitch-card"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-medium text-sm leading-tight">{project.name}</h3>
                            <p className="text-xs opacity-60 mt-1">{project.lastUpdated}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              <Chain className="w-3 h-3 mr-1" />+{project.chainLength}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={project.preview || "/placeholder.svg"}
                              alt={project.name}
                              className="w-8 h-6 rounded border border-black/10 object-cover"
                            />
                            <span className="text-xs font-medium">Score: {project.lastScore}</span>
                          </div>
                          <MoreHorizontal className="w-4 h-4 opacity-0 group-hover:opacity-60 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-3 bg-[#f5f1e8] p-4 rounded-lg border border-black/20 shadow-lg">
                      <Lock className="w-8 h-8 mx-auto opacity-60" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Pro Feature</p>
                        <p className="text-xs opacity-70">Organize uploads into projects</p>
                      </div>
                      <Button size="sm" className="bg-yellow-600 text-white hover:bg-yellow-700 text-xs">
                        <Crown className="w-3 h-3 mr-1" />
                        Upgrade
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <main className="flex-1 px-6 py-8 space-y-8 overflow-y-auto">
            {/* Welcome Message */}
            <div className="p-8 pb-0">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold glitch-text">Welcome back, Builder.</h1>
                <p className="text-lg opacity-70">Your undead designs await.</p>
              </div>
            </div>

            {/* Upload Area */}
            <div className="px-8 py-6">
              <div
                className={`
        relative overflow-hidden
        border-2 border-dashed border-black/20 rounded-lg p-8 text-center
        transition-all duration-300 cursor-pointer group
        ${isDragOver ? "border-black/50 bg-black/5 glitch-border" : "hover:border-black/30 hover:bg-black/5"}
      `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                {/* Scanlines overlay - only visible on hover */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-[0.15] transition-opacity duration-300">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black to-transparent bg-[length:100%_4px] animate-pulse" />
                </div>

                <input id="file-input" type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

                <div className="space-y-4 relative z-10">
                  <div className="mx-auto w-12 h-12 border-2 border-black/20 rounded-lg flex items-center justify-center group-hover:border-black/40 transition-colors">
                    <Upload className="w-6 h-6 opacity-60 group-hover:opacity-80 transition-opacity" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium">Drop your UI screenshot here</p>
                    <p className="text-sm opacity-60">
                      or click to browse files • Chain to existing project or start fresh
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Tabs */}
            <div className="flex-1 flex flex-col">
              <div className="border-b border-black/10">
                <div className="px-8 flex">
                  <button
                    onClick={() => setMainTab("uploads")}
                    className={`px-6 py-3 text-sm font-medium transition-all duration-200 ${
                      mainTab === "uploads"
                        ? "bg-white/50 border-b-2 border-black text-black"
                        : "text-black/60 hover:text-black/80 hover:bg-black/5"
                    }`}
                  >
                    Recent Uploads
                  </button>
                  <button
                    onClick={() => setMainTab("trends")}
                    className={`px-6 py-3 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      mainTab === "trends"
                        ? "bg-white/50 border-b-2 border-black text-black"
                        : "text-black/60 hover:text-black/80 hover:bg-black/5"
                    }`}
                  >
                    Trends
                    <Crown className="w-3 h-3 text-yellow-600" />
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 p-8">
                {mainTab === "uploads" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold">Recent Activity</h2>
                      <div className="flex items-center gap-2 text-sm opacity-60">
                        <Calendar className="w-4 h-4" />
                        Last 7 days
                      </div>
                    </div>

                    <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {recentActivity.map((activity) => (
                        <Card
                          key={activity.id}
                          className="border-black/10 bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-300"
                        >
                          <CardContent className="p-6">
                            <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-medium">{activity.projectName}</h3>
                                  <p className="text-sm opacity-60">{activity.timestamp}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold glitch-text">{activity.gripScore}</div>
                                  <p className="text-xs opacity-60">Grip Score</p>
                                </div>
                              </div>

                              <img
                                src={activity.preview || "/placeholder.svg"}
                                alt={activity.projectName}
                                className="w-full h-32 rounded border border-black/10 object-cover"
                              />

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                  <Target className="w-4 h-4 text-red-500" />
                                  <span className="opacity-80">{activity.topIssue}</span>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => handleViewReport(activity)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {mainTab === "trends" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold">Trends & Analytics</h2>
                      <Crown className="w-5 h-5 text-yellow-600" />
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                      {/* Score Progression */}
                      <Card className="border-black/10 bg-white/50 backdrop-blur-sm">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Score Progression</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between text-sm">
                            <span>Overall Improvement</span>
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          </div>

                          {/* Mock sparkline */}
                          <div className="h-24 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                          </div>

                          <div className="text-sm space-y-2">
                            <p>
                              <span className="font-medium">Average Score:</span> 72
                            </p>
                            <p>
                              <span className="font-medium">Improvement:</span> +18% this month
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Most Frequent Issues */}
                      <Card className="border-black/10 bg-white/50 backdrop-blur-sm">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Most Frequent Issues</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Palette className="w-4 h-4" />
                                <span className="text-sm">CTA clarity</span>
                              </div>
                              <span className="text-sm font-mono">67%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4" />
                                <span className="text-sm">Visual hierarchy</span>
                              </div>
                              <span className="text-sm font-mono">45%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <MousePointer className="w-4 h-4" />
                                <span className="text-sm">Touch targets</span>
                              </div>
                              <span className="text-sm font-mono">32%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Advanced Analytics Teaser */}
                      <div className="lg:col-span-2">
                        <Card className="border-black/10 bg-white/50 backdrop-blur-sm relative">
                          <CardContent className="p-6">
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80 z-10 rounded" />
                              <div className="blur-sm opacity-50 space-y-4">
                                <h3 className="text-lg font-bold">Advanced Analytics</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <p className="font-medium">Conversion Impact Predictions</p>
                                    <p className="text-sm opacity-70">AI-powered forecasting of design changes...</p>
                                  </div>
                                  <div className="space-y-2">
                                    <p className="font-medium">A/B Test Suggestions</p>
                                    <p className="text-sm opacity-70">
                                      Automated test recommendations based on your data...
                                    </p>
                                  </div>
                                  <div className="space-y-2">
                                    <p className="font-medium">Industry Benchmarking</p>
                                    <p className="text-sm opacity-70">
                                      Compare your scores against industry standards...
                                    </p>
                                  </div>
                                  <div className="space-y-2">
                                    <p className="font-medium">Custom Reports</p>
                                    <p className="text-sm opacity-70">Generate detailed reports for stakeholders...</p>
                                  </div>
                                </div>
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center z-20">
                                <div className="text-center space-y-4">
                                  <Lock className="w-12 h-12 mx-auto opacity-60" />
                                  <div className="space-y-2">
                                    <p className="text-lg font-medium">Unlock Advanced Analytics</p>
                                    <p className="opacity-70">Get deeper insights into your design performance</p>
                                  </div>
                                  <Button className="bg-yellow-600 text-white hover:bg-yellow-700">
                                    <Crown className="w-4 h-4 mr-2" />
                                    Upgrade to Pro
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
