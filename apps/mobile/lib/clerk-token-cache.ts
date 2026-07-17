import { deleteStoredItem, getStoredItem, setStoredItem } from "@/lib/persistent-storage";

const CLERK_CLIENT_JWT_KEY = "__clerk_client_jwt";

export const clerkTokenCache = {
  async getToken(key: string) {
    try {
      return await getStoredItem(key);
    } catch {
      await deleteStoredItem(key).catch(() => {});
      return null;
    }
  },
  saveToken(key: string, token: string) {
    return setStoredItem(key, token);
  },
  clearToken(key: string) {
    void deleteStoredItem(key);
  }
};

export function clearClerkClientToken() {
  return deleteStoredItem(CLERK_CLIENT_JWT_KEY);
}
