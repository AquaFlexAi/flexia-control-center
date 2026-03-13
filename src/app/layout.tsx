import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// import "@/styles/main.scss";
import { Sidebar } from "@/components/layout/sidebar";
import { MainLayout } from "@/components/layout/MainLayout";
import { createClient } from "@/utils/supabase/server";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FlexIA Control Center",
  description: "Centralized SaaS management for FlexIA AI services",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    console.log(`[RootLayout] ✅ User detected: ${user.email} (ID: ${user.id})`);
  } else {
    // In some cases (like initial page load with a fresh cookie), getUser might fail on the server 
    // but the client-side session remains valid. We log this for debugging.
    console.warn('[RootLayout] ⚠️ Server-side user session not detected.');
  }

  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <MainLayout>
          {children}
        </MainLayout>
      </body>
    </html>
  );
}
