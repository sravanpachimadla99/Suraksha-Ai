import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BackendWakeup from "../components/BackendWakeup";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "SurakshaAI — AI-Powered Public Safety Intelligence",
  description:
    "Predict, Prevent, and Protect citizens from digital fraud, scam calls, counterfeit currency, and organized cybercrime with next-generation AI.",
  keywords: [
    "fraud detection",
    "AI safety",
    "digital arrest",
    "scam prevention",
    "cybercrime",
    "India",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            const originalFetch = window.fetch;
            window.fetch = function(input, init) {
              if (typeof input === 'string' && input.startsWith('http://localhost:8000')) {
                const backendUrl = window.location.hostname === 'localhost'
                  ? 'http://localhost:8000'
                  : 'https://suraksha-ai-8g47.onrender.com';
                input = input.replace('http://localhost:8000', backendUrl);
              }
              return originalFetch(input, init);
            };
          })();
        ` }} />
      </head>
      <body className="min-h-full flex flex-col font-[var(--font-inter)]">
        <BackendWakeup />
        {children}
      </body>
    </html>
  );
}
