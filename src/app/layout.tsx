import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from '@/context/AuthContext'
import { MenuProvider } from "@/context/MenuContext";
import "../styles/globals.css";

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
        <AuthProvider>
          <MenuProvider>
            {children}
          </MenuProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
