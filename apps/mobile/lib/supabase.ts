import { createClient } from "@supabase/supabase-js";
import type { Database } from "@riftbound/db";

export function getMobileSupabase(accessToken?: string | (() => Promise<string | null>) | null) {
  const getAccessToken = typeof accessToken === "function"
    ? accessToken
    : accessToken
      ? async () => accessToken
      : undefined;

  return createClient<Database>(
    process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      ...(getAccessToken ? { accessToken: getAccessToken } : {}),
      global: {
        fetch: reactNativeFetch
      }
    }
  );
}

export function hasSupabaseConfig() {
  return Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
}

const reactNativeFetch: typeof fetch = (input, init) => {
  const headers = normalizeHeaders(init?.headers);
  const body = typeof init?.body === "string" || init?.body == null
    ? init?.body
    : JSON.stringify(init.body);

  return fetch(input, {
    body,
    cache: init?.cache,
    credentials: init?.credentials,
    headers,
    integrity: init?.integrity,
    keepalive: init?.keepalive,
    method: init?.method,
    mode: init?.mode,
    redirect: init?.redirect,
    referrer: init?.referrer,
    referrerPolicy: init?.referrerPolicy
  });
};

function normalizeHeaders(headers: HeadersInit | undefined) {
  if (!headers) {
    return undefined;
  }

  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return headers;
}
