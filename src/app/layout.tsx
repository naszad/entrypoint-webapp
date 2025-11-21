import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from '@/context/AuthContext'
import { NavigationEvents } from "@/components/navigation-events";
import { TransitionIndicator } from "@/components/ui/transition-indicator";
import "../styles/globals.css";
import MixpanelProvider from "@/components/MixpanelProvider";
import MixpanelPageTracker from "@/components/MixpanelPageTracker";

// This is necessary to allow the environment variables to be set on the window object
export const dynamic = 'force-dynamic'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EntryPointSRM",
  description: "Build a better future",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
  <MixpanelProvider />
  <MixpanelPageTracker />
        {/*
          The following script injects server-side environment variables into the client-side
          window object. This allows the Supabase client to be initialized with the correct
          configuration for the current environment.

          We use 'dangerouslySetInnerHTML' because we need to render a literal <script> tag.
          This is safe in this context because the content is generated on the server and does
          not include any user-provided data, thus preventing XSS vulnerabilities.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.env = {
                SUPABASE_URL: "${process.env.SUPABASE_URL}",
                SUPABASE_ANON_KEY: "${process.env.SUPABASE_ANON_KEY}",
                APP_URL: "${process.env.APP_URL}",
                CHAT_TIMEOUT_HOURS: "${process.env.CHAT_TIMEOUT_HOURS}",
                ENABLE_DEV_OPTIONS: "${process.env.ENABLE_DEV_OPTIONS}",
                NEXT_PUBLIC_CHAT_ASSISTANT_VERSION: "${process.env.NEXT_PUBLIC_CHAT_ASSISTANT_VERSION}",
              };
            `,
          }}
        />
        <AuthProvider>
            <TransitionIndicator isLoading={false} />
            {children}
            <NavigationEvents />
        </AuthProvider>
      </body>
    </html>
  );
}
