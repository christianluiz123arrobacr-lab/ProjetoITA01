import { useSyncExternalStore } from "react";
import { authSession } from "@/lib/authSession";

export function useSupabaseAuth() {
  const { session, loading, error, recovering } = useSyncExternalStore(authSession.subscribe, authSession.getSnapshot);
  const user = session?.user ?? null;

  return {
    session,
    user,
    loading,
    error,
    recovering,
    retry: authSession.retry,
    isAuthenticated: !!user && !error,
    signOut: authSession.signOut,
  };
}
