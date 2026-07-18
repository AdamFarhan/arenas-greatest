import { createContext, useContext } from "react";
import type { ReactNode } from "react";

export type PwaBrowser = "chrome" | "firefox" | "safari" | "other";

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

const PwaInstallContext = createContext<PwaInstallContextValue>({
  browser: "other",
  isMobile: false,
  isStandalone: false,
  isInstalled: false,
  continuedInBrowser: true,
  canInstall: false,
  installFallback: false,
  continueInBrowser: () => undefined,
  install: async () => undefined,
  openChrome: () => undefined
});

const nativePwaInstall = {
  browser: "other" as const,
  isMobile: false,
  isStandalone: false,
  isInstalled: false,
  continuedInBrowser: true,
  canInstall: false,
  installFallback: false,
  continueInBrowser: () => undefined,
  install: async () => undefined,
  openChrome: () => undefined
};

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  return <PwaInstallContext.Provider value={nativePwaInstall}>{children}</PwaInstallContext.Provider>;
}

export function usePwaInstall() {
  return useContext(PwaInstallContext);
}
