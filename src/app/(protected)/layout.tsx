'use client'
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Chat } from "@/components/chat"
import { Suspense } from "react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen h-screen">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Suspense>
            <main className="px-9 py-5 w-full min-h-full bg-gray-100 pt-9">{children}</main>
          </Suspense>
        </SidebarInset>
          <SidebarTrigger />
        <Chat />
      </SidebarProvider>
    </div>
  );
}
