'use client'
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { ChatAssistant } from "@/components/ChatAssistant"
import { Suspense } from "react"
import { ChatAssistantOpenProvider, useChatAssistantOpen } from "@/context/ChatAssistantOpenContext"
import { cn } from "@/utils/utils"

function ChatAssistantOpenLayout({ children }: { children: React.ReactNode }) {
  const { isChatAssistantOpen } = useChatAssistantOpen();
  return (
    <div
      className={cn(
        "w-full min-h-full pl-[240px] transition-all duration-300",
        isChatAssistantOpen ? "pr-[400px]" : "pr-0"
      )}
    >
      <Suspense>
        <main className="px-9 py-5 w-full min-h-full bg-gray-100 pt-9">{children}</main>
      </Suspense>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatAssistantOpenProvider>
      <div className="flex min-h-screen h-screen">
        <SidebarProvider>
          <div className="fixed inset-y-0 left-0 z-40">
            <AppSidebar />
          </div>
          <ChatAssistantOpenLayout>{children}</ChatAssistantOpenLayout>
          <ChatAssistant />
        </SidebarProvider>
      </div>
    </ChatAssistantOpenProvider>
  );
}
