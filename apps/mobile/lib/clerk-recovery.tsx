import { createContext, useContext } from "react";

type ClerkRecoveryContextValue = {
  needsClerkRecovery: boolean;
  requestClerkRecovery: () => void;
  recoverClerkSession: () => Promise<void>;
};

const ClerkRecoveryContext = createContext<ClerkRecoveryContextValue | undefined>(undefined);

export const ClerkRecoveryProvider = ClerkRecoveryContext.Provider;

export function useClerkRecovery() {
  const context = useContext(ClerkRecoveryContext);

  if (!context) {
    throw new Error("useClerkRecovery must be used within ClerkRecoveryProvider.");
  }

  return context;
}
