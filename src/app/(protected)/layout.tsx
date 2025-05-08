'use client'
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Suspense } from "react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen h-screen">
      <SidebarProvider>
        <div className="fixed inset-y-0 left-0 z-40">
          <AppSidebar />
        </div>
        <div className="w-full h-full pl-[240px]">
          <Suspense>
            <main className="p-6 w-full h-full">{children}</main>
          </Suspense>
        </div>
      </SidebarProvider>
    </div>
  );
}
