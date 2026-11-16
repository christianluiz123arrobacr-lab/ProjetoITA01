import { BookOpen, CircleHelp, MessageCircle } from "lucide-react";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HELP_PATH, SUPPORT_WHATSAPP_URL } from "@/config/help";
import { cn } from "@/lib/utils";

export default function HelpMenu({ className }: { className?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Ajuda"
          title="Ajuda"
          className={cn("inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-current/20 hover:bg-current/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500", className)}
        >
          <CircleHelp className="size-5" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        aria-label="Opções de ajuda"
        align="end"
        sideOffset={8}
        collisionPadding={12}
        className="z-[80] w-80 max-w-[calc(100vw-24px)] rounded-xl p-1.5"
      >
        <DropdownMenuItem asChild className="cursor-pointer items-start gap-3 rounded-lg p-3">
          <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="mt-0.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>
              <span className="block font-semibold">Falar com o suporte</span>
              <span className="block text-xs leading-5 opacity-85">Entre em contato pelo WhatsApp (nova aba).</span>
            </span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer items-start gap-3 rounded-lg p-3">
          <Link href={HELP_PATH}>
            <BookOpen className="mt-0.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <span>
              <span className="block font-semibold">Conhecer as funcionalidades</span>
              <span className="block text-xs leading-5 opacity-85">Aprenda a usar as ferramentas do Projeto Vetor.</span>
            </span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
