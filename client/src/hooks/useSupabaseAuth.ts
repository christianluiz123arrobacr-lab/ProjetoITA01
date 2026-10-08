import { useSyncExternalStore } from "react";
import { authSession } from "@/lib/authSession";

export function useSupabaseAuth() {
  const { session, loading, error } = useSyncExternalStore(authSession.subscribe, authSession.getSnapshot);
  const user = session?.user ?? null;

  return {
    session,
    user,
    loading,
    error,
    retry: authSession.retry,
    isAuthenticated: !!user && !error,
    signOut: authSession.signOut,
  };
}
