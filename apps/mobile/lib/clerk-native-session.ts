import { TurboModuleRegistry, type TurboModule } from "react-native";

type NativeClerkSession = {
  sessionId?: string;
  session?: {
    id?: string;
  };
};

type NativeClerkModule = TurboModule & {
  getSession: () => Promise<NativeClerkSession | null>;
};

const clerkExpoModule = TurboModuleRegistry.get<NativeClerkModule>("ClerkExpo");

export async function hasNativeClerkSession() {
  const session = await clerkExpoModule?.getSession();

  return Boolean(session?.sessionId || session?.session?.id);
}
