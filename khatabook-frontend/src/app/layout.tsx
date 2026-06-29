import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MitekOne — AI-Powered CRM & Business Management Platform",
    template: "%s | MitekOne",
  },
  description:
    "MitekOne helps businesses manage customers, track credit & payments, monitor inventory, and grow smarter with AI-powered insights. Start free today.",
  keywords: [
    "MitekOne",
    "business management",
    "AI CRM",
    "customer ledger",
    "payment tracking",
    "inventory management",
    "business management platform",
    "Indian CRM",
    "Generative AI",
  ],
  authors: [{ name: "Mitesh Jadav" }],
  creator: "Mitesh Jadav",
  openGraph: {
    title: "MitekOne — AI-Powered CRM & Business Management Platform",
    description:
      "Manage customers, track payments, and grow your business with AI-powered insights.",
    type: "website",
    locale: "en_IN",
    siteName: "MitekOne",
  },
  twitter: {
    card: "summary_large_image",
    title: "MitekOne — AI-Powered CRM & Business Management Platform",
    description:
      "Manage customers, track payments, and grow your business with AI-powered insights.",
  },
  robots: { index: true, follow: true },
};

import Navbar from "@/components/Navbar";
import ThemeProvider from "@/components/ThemeProvider";
import SessionTimeout from "@/components/SessionTimeout";
import { CopilotProvider } from "@/components/ai-copilot";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body>
        <ThemeProvider />
        <Navbar />
        <SessionTimeout />
        <CopilotProvider>
          <div className="page-wrapper">{children}</div>
        </CopilotProvider>
      </body>
    </html>
  );
}
