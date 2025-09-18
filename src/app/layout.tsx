import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from '@/context/AuthContext'
import { NavigationEvents } from "@/components/navigation-events";
import { TransitionIndicator } from "@/components/ui/transition-indicator";
import "../styles/globals.css";

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
  description: "This is a SaaS product called EntryPoint. It is a tool initially aimed at high school counselors and school administrators, to help them improve student outcomes by saving time. EntryPoint removes administrative burden by making it easier to access key data and reports from their SIS (Student Information System) that will help them monitor student progress — grades, attendance, etc.",
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
