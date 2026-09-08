// This is an untrusted attribution hint. All eligibility is checked by SQL.
export function getReferralHint(): string | undefined {
  try {
    const query = new URLSearchParams(window.location.search).get("ref");
    if (query && /^[a-f0-9]{32}$/.test(query))
      sessionStorage.setItem("vetor-referral", query);
    const code = sessionStorage.getItem("vetor-referral");
    return code && /^[a-f0-9]{32}$/.test(code) ? code : undefined;
  } catch {
    return undefined;
  }
}

export function clearReferralHint() {
  try {
    sessionStorage.removeItem("vetor-referral");
  } catch {
    // Storage may be unavailable; attribution has already been handled by the backend.
  }
}
