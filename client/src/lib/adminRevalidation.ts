export const ADMIN_RECOVERY_GRACE_MS = 60_000;
export function adminAccessRecheck(query: { state: { status: string } }) {
  return query.state.status === "error" ? false : 5 * 60 * 1000;
}
export type AdminConfirmation = { userId: string; role: string; failedAt: number | null };
type Input = { userId?: string; role?: string; responseUserId?: string; loading: boolean; failed: boolean; definitive: boolean; roles: readonly string[]; now: number };

/** Visual continuity only. This never grants server authorization. */
export function evaluateAdminAccess(previous: AdminConfirmation | null, input: Input) {
  if (!input.userId || input.definitive) return { confirmation: null, status: "blocked" as const };
  const sameUser = previous?.userId === input.userId && input.roles.includes(previous.role);
  if (input.failed) {
    if (!sameUser) return { confirmation: null, status: "error" as const };
    const confirmation = { ...previous, failedAt: previous.failedAt ?? input.now };
    return { confirmation, status: input.now - confirmation.failedAt < ADMIN_RECOVERY_GRACE_MS ? "recovering" as const : "error" as const };
  }
  if (input.loading) return { confirmation: sameUser ? previous : null, status: sameUser ? "allowed" as const : "checking" as const };
  if (input.responseUserId !== input.userId || !input.role || !input.roles.includes(input.role)) {
    return { confirmation: null, status: "blocked" as const };
  }
  return { confirmation: { userId: input.userId, role: input.role, failedAt: null }, status: "allowed" as const };
}

// A mounted administrative guard can suspend new protected requests while its
// editor stays mounted. It cannot grant anything, and is isolated by user/owner.
const suspended = new Map<symbol, string>();
export function suspendAdminRequests(owner: symbol, userId: string | null) {
  if (userId) suspended.set(owner, userId); else suspended.delete(owner);
}
export function isAdminRequestSuspended(userId: string | undefined) {
  return !!userId && Array.from(suspended.values()).includes(userId);
}
