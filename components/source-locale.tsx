"use client";

import { useEffect } from "react";

const LANGUAGE_KEY = "print-prep-lab-language";
const LEGACY_LANGUAGE_KEY = "ppl-interface-language";

type Language = "en" | "ar";

function translateDocument(lang: Language) {
  document.querySelectorAll<HTMLElement>("[data-en][data-ar]").forEach((element) => {
    const value = lang === "ar" ? element.dataset.ar : element.dataset.en;
    if (value && element.textContent !== value) element.textContent = value;
  });

  document.querySelectorAll<HTMLInputElement>("[data-placeholder-en][data-placeholder-ar]").forEach((element) => {
    const value = lang === "ar" ? element.dataset.placeholderAr : element.dataset.placeholderEn;
    if (value && element.placeholder !== value) element.placeholder = value;
  });

  document.querySelectorAll<HTMLSelectElement>("[data-source-lang]").forEach((select) => {
    if (select.value !== lang) select.value = lang;
  });
}

function applyLanguage(language: Language, persist = true) {
  const lang: Language = language === "ar" ? "ar" : "en";
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  translateDocument(lang);

  if (persist) {
    try {
      window.localStorage.setItem(LANGUAGE_KEY, lang);
      window.localStorage.setItem(LEGACY_LANGUAGE_KEY, lang);
    } catch {}
  }

  window.dispatchEvent(new CustomEvent("print-prep:languagechange", { detail: { language: lang } }));
}

function initialLanguage(): Language {
  const query = new URLSearchParams(window.location.search).get("lang");
  if (query === "ar" || query === "en") return query;

  try {
    const current = window.localStorage.getItem(LANGUAGE_KEY);
    if (current === "ar" || current === "en") return current;
    const legacy = window.localStorage.getItem(LEGACY_LANGUAGE_KEY);
    if (legacy === "ar" || legacy === "en") return legacy;
  } catch {}

  return "en";
}

export function SourceLocaleSelect() {
  useEffect(() => {
    const language = initialLanguage();
    applyLanguage(language);

    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        translateDocument(document.documentElement.lang === "ar" ? "ar" : "en");
      });
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <label className="source-lang-wrap">
      <span className="sr-only" data-en="Interface language" data-ar="لغة الواجهة">Interface language</span>
      <select
        className="source-lang-select"
        data-source-lang
        aria-label="Interface language"
        defaultValue="en"
        onChange={(event) => applyLanguage(event.currentTarget.value === "ar" ? "ar" : "en")}
      >
        <option value="en">EN</option>
        <option value="ar">AR</option>
      </select>
    </label>
  );
}
