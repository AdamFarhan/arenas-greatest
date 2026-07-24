"use client";

import { useAuth } from "@clerk/nextjs";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthQueryCacheBoundary />
      {children}
    </QueryClientProvider>
  );
}

function AuthQueryCacheBoundary() {
  const { isLoaded, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      queryClient.clear();
    }
  }, [isLoaded, isSignedIn, queryClient]);

  return null;
}
