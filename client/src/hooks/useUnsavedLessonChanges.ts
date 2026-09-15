import { useEffect } from "react";

export function hasUnsavedLessonChanges(savedSnapshot: string, currentSnapshot: string) {
  return savedSnapshot.length > 0 && savedSnapshot !== currentSnapshot;
}

export function useUnsavedLessonChanges(hasChanges: boolean) {
  useEffect(() => {
    if (!hasChanges) return;
    const message = "Há alterações no rascunho que ainda não foram salvas.";
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
    };
    const click = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!target || target.getAttribute("target") === "_blank" || target.hasAttribute("download")) return;
      if (!window.confirm(`${message} Deseja sair mesmo assim?`)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const popState = () => {
      if (!window.confirm(`${message} Deseja sair mesmo assim?`)) window.history.go(1);
    };
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("popstate", popState);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("popstate", popState);
      document.removeEventListener("click", click, true);
    };
  }, [hasChanges]);
}
