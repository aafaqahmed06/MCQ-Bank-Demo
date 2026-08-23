"use client";

import { useEffect, useId, useRef } from "react";

type CaptchaProvider = "hcaptcha" | "turnstile";

type CaptchaRenderApi = {
  render: (
    container: HTMLElement,
    params: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
    },
  ) => string;
};

declare global {
  interface Window {
    hcaptcha?: CaptchaRenderApi;
    turnstile?: CaptchaRenderApi;
  }
}

const PROVIDER_CONFIG: Record<
  CaptchaProvider,
  { scriptSrc: string; globalName: CaptchaProvider }
> = {
  hcaptcha: {
    scriptSrc: "https://js.hcaptcha.com/1/api.js?render=explicit",
    globalName: "hcaptcha",
  },
  turnstile: {
    scriptSrc: "https://challenges.cloudflare.com/turnstile/v0/api.js",
    globalName: "turnstile",
  },
};

const PROVIDER = process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER as
  | CaptchaProvider
  | undefined;
const SITE_KEY = process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY;

/**
 * Renders nothing until NEXT_PUBLIC_CAPTCHA_PROVIDER + NEXT_PUBLIC_CAPTCHA_SITE_KEY
 * are set (see .env.example) -- inert scaffold until a provider is chosen.
 * Supabase's captcha protection, once enabled in config.toml, gates
 * signup/sign-in/password-recovery together, so this is meant to be mounted
 * on all three forms.
 */
export default function CaptchaWidget({
  onToken,
}: {
  onToken: (token: string | undefined) => void;
}) {
  const containerId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!PROVIDER || !SITE_KEY) return;
    const config = PROVIDER_CONFIG[PROVIDER];
    if (!config) return;

    let cancelled = false;

    function renderWidget() {
      const api = window[config.globalName];
      if (!api || !containerRef.current || cancelled) return;
      api.render(containerRef.current, {
        sitekey: SITE_KEY!,
        callback: (token) => onToken(token),
        "expired-callback": () => onToken(undefined),
      });
    }

    const scriptId = `captcha-script-${PROVIDER}`;
    const existing = document.getElementById(scriptId);
    if (existing) {
      if (window[config.globalName]) renderWidget();
      else existing.addEventListener("load", renderWidget);
    } else {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = config.scriptSrc;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", renderWidget);
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      onToken(undefined);
    };
  }, [onToken]);

  if (!PROVIDER || !SITE_KEY) return null;

  return <div ref={containerRef} id={containerId} className="my-2" />;
}
