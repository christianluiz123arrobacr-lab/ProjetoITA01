const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT?.trim();
const analyticsWebsiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID?.trim();

export function initializeAnalytics() {
  if (!analyticsEndpoint || !analyticsWebsiteId) return;
  if (document.querySelector("script[data-projetoita-analytics]")) return;

  const script = document.createElement("script");
  script.defer = true;
  script.src = `${analyticsEndpoint.replace(/\/$/, "")}/umami`;
  script.dataset.websiteId = analyticsWebsiteId;
  script.dataset.projetoitaAnalytics = "true";
  document.head.appendChild(script);
}
