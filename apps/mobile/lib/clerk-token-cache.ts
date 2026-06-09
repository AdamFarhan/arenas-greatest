import * as SecureStore from "expo-secure-store";

const CLERK_CLIENT_JWT_KEY = "__clerk_client_jwt";
const secureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK
};

export const clerkTokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key, secureStoreOptions);
    } catch {
      await SecureStore.deleteItemAsync(key, secureStoreOptions);
      return null;
    }
  },
  saveToken(key: string, token: string) {
    return SecureStore.setItemAsync(key, token, secureStoreOptions);
  },
  clearToken(key: string) {
    void SecureStore.deleteItemAsync(key, secureStoreOptions);
  }
};

export function clearClerkClientToken() {
  return SecureStore.deleteItemAsync(CLERK_CLIENT_JWT_KEY, secureStoreOptions);
}
