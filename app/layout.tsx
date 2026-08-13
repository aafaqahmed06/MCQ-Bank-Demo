import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | MBBS Practice`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "MCQ practice for MBBS students — blocks, modules, and exams",
  keywords: ["MBBS", "MCQ", "practice", "medical exam", "DiagKnow"],
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | MBBS Practice`,
    description:
      "MCQ practice for MBBS students — blocks, modules, and exams",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | MBBS Practice`,
    description:
      "MCQ practice for MBBS students — blocks, modules, and exams",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--bg-page)] text-[var(--text-body)] overflow-x-hidden">
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}