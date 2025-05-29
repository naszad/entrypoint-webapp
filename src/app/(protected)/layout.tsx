'use client'
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { ChatAssistant } from "@/components/ChatAssistant"
import { Suspense } from "react"
import { useState, useEffect } from "react"
import { cn } from "@/utils/utils"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isChatAssistantOpen, setIsChatAssistantOpen] = useState(false)

  // Listen for sidebar state changes
  useEffect(() => {
    const handleStorageChange = () => {
      const savedState = localStorage.getItem('chatAssistantOpen')
      if (savedState !== null) {
        setIsChatAssistantOpen(JSON.parse(savedState))
      }
    }

    // Initial check
    handleStorageChange()

    // Listen for changes
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <div className="flex min-h-screen h-screen">
      <SidebarProvider>
        <div className="fixed inset-y-0 left-0 z-40">
          <AppSidebar />
        </div>
        <div 
          className={cn(
            "w-full h-full pl-[240px] transition-all duration-300",
            isChatAssistantOpen ? "pr-[400px]" : "pr-0"
          )}
        >
          <Suspense>
            <main className="px-6 py-3 w-full h-full">{children}</main>
          </Suspense>
        </div>
        <ChatAssistant />
      </SidebarProvider>
    </div>
  );
}
