"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[][] };
  }
}

const CLARITY_PROJECT_ID =
  process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim() || "zxpx05efwp";
const CONSENT_KEY = "print-prep-analytics-consent";

function clarityQueue() {
  if (window.clarity) return window.clarity;

  const queue = ((...args: unknown[]) => {
    queue.q = queue.q || [];
    queue.q.push(args);
  }) as NonNullable<Window["clarity"]>;

  window.clarity = queue;
  return queue;
}

function enableAnalytics() {
  clarityQueue()("consentv2", {
    ad_Storage: "denied",
    analytics_Storage: "granted",
  });

  if (document.querySelector("script[data-print-prep-clarity]")) return;

  const script = document.createElement("script");
  script.async = true;
  script.dataset.printPrepClarity = "true";
  script.src = `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`;
  document.head.appendChild(script);
}

export function AnalyticsConsent() {
  const [storedChoice, setStoredChoice] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const choice = window.localStorage.getItem(CONSENT_KEY);
    if (choice === "granted") enableAnalytics();

    const timer = window.setTimeout(() => {
      if (choice === "granted" || choice === "denied") {
        setStoredChoice(choice);
      } else {
        setIsOpen(true);
      }
    }, 0);

    const reopen = () => setIsOpen(true);
    window.addEventListener("print-prep:privacy-settings", reopen);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("print-prep:privacy-settings", reopen);
    };
  }, []);

  function saveChoice(choice: "granted" | "denied") {
    window.localStorage.setItem(CONSENT_KEY, choice);
    setStoredChoice(choice);
    setIsOpen(false);

    if (choice === "granted") {
      enableAnalytics();
      return;
    }

    if (window.clarity) {
      window.clarity("consentv2", {
        ad_Storage: "denied",
        analytics_Storage: "denied",
      });
      window.clarity("consent", false);
    }
  }

  if (!isOpen) return null;

  const declineEn = storedChoice === "granted" ? "Withdraw" : "Decline";
  const declineAr = storedChoice === "granted" ? "سحب الموافقة" : "رفض";

  return (
    <aside className="privacy-choice-banner" aria-label="Analytics privacy choices">
      <div>
        <strong data-en="Optional analytics" data-ar="تحليلات اختيارية">Optional analytics</strong>
        <p>
          <span data-en="Clarity loads only if you allow it. Images stay on your device." data-ar="يعمل Clarity فقط بعد موافقتك، وتبقى الصور على جهازك.">Clarity loads only if you allow it. Images stay on your device.</span>{" "}
          <Link href="/privacy" data-en="Privacy details" data-ar="تفاصيل الخصوصية">Privacy details</Link>
        </p>
      </div>
      <div className="privacy-choice-actions">
        <button type="button" className="allow" onClick={() => saveChoice("granted")} data-en="Allow" data-ar="سماح">
          Allow
        </button>
        <button type="button" onClick={() => saveChoice("denied")} data-en={declineEn} data-ar={declineAr}>
          {declineEn}
        </button>
      </div>
    </aside>
  );
}

export function PrivacySettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("print-prep:privacy-settings"))}
      data-en="Analytics choices"
      data-ar="خيارات التحليلات"
    >
      Analytics choices
    </button>
  );
}
