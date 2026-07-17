import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const secureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK
};

function hasLocalStorage() {
  return typeof globalThis.localStorage !== "undefined";
}

export async function getStoredItem(key: string) {
  if (Platform.OS === "web") {
    return hasLocalStorage() ? globalThis.localStorage.getItem(key) : null;
  }

  return SecureStore.getItemAsync(key, secureStoreOptions);
}

export async function setStoredItem(key: string, value: string) {
  if (Platform.OS === "web") {
    if (hasLocalStorage()) {
      globalThis.localStorage.setItem(key, value);
    }
    return;
  }

  return SecureStore.setItemAsync(key, value, secureStoreOptions);
}

export async function deleteStoredItem(key: string) {
  if (Platform.OS === "web") {
    if (hasLocalStorage()) {
      globalThis.localStorage.removeItem(key);
    }
    return;
  }

  return SecureStore.deleteItemAsync(key, secureStoreOptions);
}
