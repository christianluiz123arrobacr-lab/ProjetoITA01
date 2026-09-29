export const ADMIN_ROUTE_PREFIX = "/admin";
export const LEGACY_ADMIN_ROUTE_PREFIX = "/plataforma/admin";

export function isPathWithinPrefix(path: string, prefix: string) {
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function isAdminPath(path: string) {
  return isPathWithinPrefix(path, ADMIN_ROUTE_PREFIX) ||
    isPathWithinPrefix(path, LEGACY_ADMIN_ROUTE_PREFIX);
}

export function normalizeLegacyAdminPath(path: string) {
  if (!isPathWithinPrefix(path, LEGACY_ADMIN_ROUTE_PREFIX)) return null;
  return path.replace(/^\/plataforma\/admin/, ADMIN_ROUTE_PREFIX) || ADMIN_ROUTE_PREFIX;
}
