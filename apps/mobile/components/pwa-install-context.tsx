import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

const CONTINUE_IN_BROWSER_KEY = "riftbound.pwa.continue-in-browser";

export type PwaBrowser = "chrome" | "firefox" | "safari" | "other";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type PwaInstallContextValue = {
  browser: PwaBrowser;
  isMobile: boolean;
  isStandalone: boolean;
  isInstalled: boolean;
  continuedInBrowser: boolean;
  canInstall: boolean;
  installFallback: boolean;
  continueInBrowser: () => void;
  install: () => Promise<void>;
  openChrome: () => void;
};

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

function getBrowserState() {
  const userAgent = window.navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);
  const isMobile = isAndroid || isIos || /Mobile/i.test(userAgent);
  const isFirefox = /Firefox|FxiOS/i.test(userAgent);
  const isSafari = isIos && /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent);
  const isChrome = /Chrome|CriOS|Edg|OPR|SamsungBrowser/i.test(userAgent);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)) ||
    document.referrer.startsWith("android-app://");

  return {
    browser: isFirefox ? "firefox" : isSafari ? "safari" : isChrome ? "chrome" : "other" as PwaBrowser,
    isMobile,
    isStandalone
  };
}

function getChromeIntentUrl() {
  return `googlechrome://navigate?url=${encodeURIComponent(window.location.href)}`;
}

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [browser, setBrowser] = useState<PwaBrowser>("other");
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [continuedInBrowser, setContinuedInBrowser] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installFallback, setInstallFallback] = useState(false);

  useEffect(() => {
    const state = getBrowserState();
    setBrowser(state.browser);
    setIsMobile(state.isMobile);
    setIsStandalone(state.isStandalone);
    setIsInstalled(state.isStandalone);
    setContinuedInBrowser(window.localStorage.getItem(CONTINUE_IN_BROWSER_KEY) === "true");

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsStandalone(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const value = useMemo<PwaInstallContextValue>(() => ({
    browser,
    isMobile,
    isStandalone,
    isInstalled,
    continuedInBrowser,
    canInstall: installPrompt !== null,
    installFallback,
    continueInBrowser: () => {
      window.localStorage.setItem(CONTINUE_IN_BROWSER_KEY, "true");
      setContinuedInBrowser(true);
    },
    install: async () => {
      if (!installPrompt) {
        setInstallFallback(true);
        return;
      }

      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setInstallPrompt(null);

      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      }
    },
    openChrome: () => {
      window.location.href = getChromeIntentUrl();
    }
  }), [browser, continuedInBrowser, installFallback, installPrompt, isInstalled, isMobile, isStandalone]);

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
}

export function usePwaInstall() {
  const context = useContext(PwaInstallContext);

  if (!context) {
    throw new Error("usePwaInstall must be used inside PwaInstallProvider");
  }

  return context;
}
