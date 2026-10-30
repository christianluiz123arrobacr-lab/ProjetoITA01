import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
export default function CommerceHeader() {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="border-b border-border bg-card text-foreground">
      <nav
        aria-label="Navegação da conta"
        className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3"
      >
        <a href="/planos" className="flex items-center gap-2 font-bold">
          <img src="/brand/projeto-vetor-logo.svg" alt="" className="h-8 w-8" />
          Projeto Vetor
        </a>
        <div className="flex items-center gap-4 text-sm">
          <a className="hover:underline" href="/minha-assinatura">
            Minha conta
          </a>
          <button
            type="button"
            className="rounded-lg border p-2"
            aria-label={
              theme === "dark" ? "Usar tema claro" : "Usar tema escuro"
            }
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </nav>
    </header>
  );
}
