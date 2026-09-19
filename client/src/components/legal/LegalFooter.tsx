import { Link } from "wouter";

const links = [["Termos de Uso", "/termos-de-uso"], ["Política de Privacidade", "/politica-de-privacidade"], ["Assinaturas e reembolso", "/assinaturas-cancelamento-e-reembolso"], ["Regras Indique e Ganhe", "/regras-indique-e-ganhe"]] as const;

export default function LegalFooter() {
  return <footer className="theme-page border-t border-slate-200 bg-white px-4 py-5 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"><nav aria-label="Documentos legais" className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-5 gap-y-2 text-xs">{links.map(([label, href]) => <Link key={href} href={href}><a className="rounded-sm hover:text-cyan-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:hover:text-cyan-300">{label}</a></Link>)}</nav></footer>;
}
