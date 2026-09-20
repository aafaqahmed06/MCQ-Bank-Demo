"use client";

import { forwardRef, useEffect, useId, useImperativeHandle, useRef } from "react";

type CaptchaProvider = "hcaptcha" | "turnstile";

type CaptchaRenderApi = {
  render: (
    container: HTMLElement,
    params: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ) => string;
  reset: (widgetId: string) => void;
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
 * Single source of truth for whether the widget will actually render.
 * Forms that mount CaptchaWidget should import this instead of re-reading
 * the env vars, so the "is captcha required before submit" check can never
 * drift from the widget's own "render nothing" check below.
 */
export const isCaptchaConfigured = Boolean(PROVIDER && SITE_KEY);

export type CaptchaWidgetHandle = {
  /** Fetch a fresh token without recreating the whole widget/script. */
  reset: () => void;
};

/**
 * Renders nothing until NEXT_PUBLIC_CAPTCHA_PROVIDER + NEXT_PUBLIC_CAPTCHA_SITE_KEY
 * are set (see .env.example) -- inert scaffold until a provider is chosen.
 * Supabase's captcha protection, once enabled in config.toml, gates
 * signup/sign-in/password-recovery together, so this is meant to be mounted
 * on all three forms.
 */
const CaptchaWidget = forwardRef<
  CaptchaWidgetHandle,
  {
    onToken: (token: string | undefined) => void;
    onError?: () => void;
  }
>(function CaptchaWidget({ onToken, onError }, ref) {
  const containerId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (!PROVIDER || !widgetIdRef.current) return;
      window[PROVIDER]?.reset(widgetIdRef.current);
    },
  }));

  useEffect(() => {
    if (!isCaptchaConfigured) return;
    const config = PROVIDER_CONFIG[PROVIDER!];
    if (!config) return;

    let cancelled = false;

    function renderWidget() {
      const api = window[config.globalName];
      if (!api || !containerRef.current || cancelled) return;
      widgetIdRef.current = api.render(containerRef.current, {
        sitekey: SITE_KEY!,
        callback: (token) => onToken(token),
        "expired-callback": () => onToken(undefined),
        "error-callback": () => onError?.(),
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
  }, [onToken, onError]);

  if (!isCaptchaConfigured) return null;

  return <div ref={containerRef} id={containerId} className="my-2" />;
});

export default CaptchaWidget;
