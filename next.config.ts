import type { NextConfig } from "next";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://example.supabase.co";
let supabaseOrigin = "https://example.supabase.co";
try {
  supabaseOrigin = new URL(supabaseUrl).origin;
} catch {
  // keep fallback origin
}

// CSP allowances for whichever captcha provider CaptchaWidget is actually
// configured to load (see NEXT_PUBLIC_CAPTCHA_PROVIDER in CaptchaWidget.tsx).
// Without these, the widget's script/iframe is silently blocked by CSP, the
// captcha token never arrives, and captcha-gated auth breaks even though the
// widget "looks" wired up correctly.
const captchaProvider = process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER;
const captchaCsp =
  captchaProvider === "turnstile"
    ? {
        script: "https://challenges.cloudflare.com",
        frame: "https://challenges.cloudflare.com",
        connect: "https://challenges.cloudflare.com",
      }
    : captchaProvider === "hcaptcha"
      ? {
          script: "https://js.hcaptcha.com",
          frame: "https://newassets.hcaptcha.com https://*.hcaptcha.com",
          connect: "https://*.hcaptcha.com",
        }
      : null;

const securityHeaders = [
  // Block embedding the app in other sites (clickjacking). X-Frame-Options is
  // the broadly-supported header; frame-ancestors in CSP is the modern one.
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent browsers from MIME-sniffing responses into a different type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Only send the origin (not full URL / query strings) to other origins.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Default Deny for web-platform APIs the app does not use.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `connect-src 'self' ${supabaseOrigin} https://accounts.google.com${captchaCsp ? ` ${captchaCsp.connect}` : ""}`,
      `script-src 'self' 'unsafe-inline'${captchaCsp ? ` ${captchaCsp.script}` : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      `frame-src 'self'${captchaCsp ? ` ${captchaCsp.frame}` : ""}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
