import { describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
const cleared = vi.hoisted(() => vi.fn());
vi.mock("../client/src/services/access.service", () => ({
  clearCachedPlatformAccess: cleared,
}));
import { invalidateRoleCaches } from "../client/src/lib/roleCache";

describe("cache visual após alteração administrativa confirmada", () => {
  it("invalida papel, acesso e listas sem encerrar a sessão ou alterar pagamentos", () => {
    const client = new QueryClient();
    const paths = [
      "auth.me",
      "auth.getAccessStatus",
      "admin.listAdminUsers",
      "billing.getMySubscription",
    ];
    for (const path of paths)
      client.setQueryData([path.split("."), {}], { synthetic: true });
    invalidateRoleCaches(client, [["admin", "removeAdminAccess"]], {
      userId: "revoked",
      role: "student",
    });
    expect(cleared).toHaveBeenCalledWith("revoked");
    for (const path of paths)
      expect(client.getQueryState([path.split("."), {}])?.isInvalidated).toBe(
        !path.startsWith("billing")
      );
    client.clear();
  });
  it("não invalida papéis por mutações sem relação", () => {
    cleared.mockClear();
    const client = new QueryClient();
    client.setQueryData([["auth", "me"], {}], { synthetic: true });
    invalidateRoleCaches(client, [["admin", "createQuestion"]], {});
    expect(client.getQueryState([["auth", "me"], {}])?.isInvalidated).toBe(
      false
    );
    expect(cleared).not.toHaveBeenCalled();
    client.clear();
  });
});
