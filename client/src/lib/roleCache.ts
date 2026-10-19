import type { QueryClient } from "@tanstack/react-query";
import { clearCachedPlatformAccess } from "@/services/access.service";

export function invalidateRoleCaches(
  client: QueryClient,
  key: unknown,
  data: unknown
) {
  if (
    !Array.isArray(key) ||
    !Array.isArray(key[0]) ||
    key[0][0] !== "admin" ||
    ![
      "removeAdminAccess",
      "grantAdminAccess",
      "updateAdminRole",
      "updateProfile",
    ].includes(key[0][1])
  )
    return;
  if (
    data &&
    typeof data === "object" &&
    "userId" in data &&
    typeof data.userId === "string"
  )
    clearCachedPlatformAccess(data.userId);
  void client.invalidateQueries({
    predicate: query => {
      const path = query.queryKey[0];
      return Array.isArray(path) && (path[0] === "auth" || path[0] === "admin");
    },
  });
}
