import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const plusJkt = Plus_Jakarta_Sans({
  variable: "--font-plus-jkt",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DiagKnow | MBBS Practice",
  description: "MCQ practice for MBBS students — blocks, modules, and exams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJkt.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--bg-page)] text-[var(--text-body)] overflow-x-hidden">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
