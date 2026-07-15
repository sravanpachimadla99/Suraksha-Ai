import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
      <body className="min-h-full flex flex-col font-[var(--font-inter)]">
        {children}
      </body>
    </html>
  );
}
