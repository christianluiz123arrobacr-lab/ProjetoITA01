import { Link } from "wouter";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";

type LegalKind = "terms" | "privacy" | "billing" | "referrals";

const documents: Record<LegalKind, { title: string; intro: string; sections: Array<[string, string[]]> }> = {
  terms: {
    title: "Termos de Uso",
    intro: "Estes termos explicam as regras básicas para usar o Projeto Vetor com segurança e respeito.",
    sections: [
      ["A plataforma", ["O Projeto Vetor é uma plataforma educacional em fase beta e em evolução contínua. Recursos beta podem mudar para melhorar o serviço, sem que isso seja usado para negar um serviço pago já contratado.", "A conta é individual. Você é responsável por proteger seu login e avisar o suporte se suspeitar de uso indevido."]],
      ["Uso permitido", ["Questões, explicações e exportações destinam-se ao estudo pessoal. Não é permitido compartilhar contas, revender conteúdo ou PDFs, raspar dados, burlar limites, atacar a plataforma ou agir de modo fraudulento.", "Fraude e abuso podem levar à suspensão, após análise do caso, sem retirar os direitos legais do usuário."]],
      ["Suporte", ["Dúvidas sobre acesso ou uso podem ser encaminhadas ao canal de suporte indicado ao final desta página."]],
    ],
  },
  privacy: {
    title: "Política de Privacidade",
    intro: "Esta política descreve os dados usados para operar e proteger o Projeto Vetor.",
    sections: [
      ["Dados e finalidades", ["Tratamos dados de cadastro, uso da plataforma, assinaturas, pagamentos, indicações, aceitações de termos e, quando fornecidos, telefone e WhatsApp. Eles servem para autenticação, acesso, suporte, segurança, cobrança, prevenção a fraude e melhoria do serviço.", "O Projeto Vetor não armazena dados de cartão. O processamento de pagamentos é feito pelo Mercado Pago."]],
      ["Serviços envolvidos", ["A operação utiliza Supabase para autenticação e dados, Vercel para hospedagem, Mercado Pago para pagamentos e Google Drive quando o próprio usuário conecta esse recurso."]],
      ["Seus direitos", ["Você pode solicitar confirmação de tratamento, acesso, correção, informação, oposição ou exclusão quando cabível pela LGPD, usando o contato abaixo.", "Dados de menores devem ser tratados conforme a LGPD e com a participação do responsável quando exigida. Telefone não será usado para mensagens promocionais sem uma opção específica, separada e voluntária."]],
    ],
  },
  billing: {
    title: "Assinaturas, cancelamento e reembolso",
    intro: "Aqui estão as regras gerais de contratação e encerramento do acesso pago.",
    sections: [
      ["Contratação", ["Preço, duração e forma de pagamento aparecem no checkout antes da confirmação. Planos recorrentes podem renovar conforme informado no checkout; pacotes pré-pagos concedem o período adquirido e não se renovam automaticamente."]],
      ["Cancelamento e acesso", ["O cancelamento de uma recorrência bloqueia cobranças futuras e, quando aplicável, mantém o acesso até o fim do período já pago. O término de um pacote pré-pago encerra o acesso ao final do prazo contratado."]],
      ["Atendimento e reembolso", ["Pedidos de cancelamento, dúvidas e reembolso podem ser enviados ao canal de suporte abaixo. Cada caso respeitará os direitos aplicáveis do consumidor e as condições apresentadas na contratação."]],
    ],
  },
  referrals: {
    title: "Regras do Indique e Ganhe",
    intro: "Estas regras explicam quando o indicado e o indicador recebem benefícios.",
    sections: [
      ["Benefício do indicado", ["O novo aluno indicado recebe 15% de desconto no primeiro pagamento elegível. O desconto vale somente para Pix e pacotes pré-pagos; cartão recorrente permanece com o preço normal e não há checkout gratuito."]],
      ["Recompensa do indicador", ["A cada 3 novos indicados com pagamento aprovado, acesso aplicado e sem estorno, o indicador recebe 30 dias de acesso.", "Autoindicação, contas duplicadas, fraude e pagamentos estornados não geram benefício."]],
      ["Condições da campanha", ["A campanha pode ter datas, limites e regras adicionais exibidos na página. O programa não substitui promoções aplicáveis nem direitos legais."]],
    ],
  },
};

export default function LegalPage({ kind }: { kind: LegalKind }) {
  const document = documents[kind];
  const config = trpc.legal.publicConfig.useQuery();
  const email = config.data?.contactEmail;
  return (
    <main className="theme-page min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
      <article className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">
        <Link href="/landing"><a className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 hover:underline dark:text-cyan-300"><ArrowLeft className="h-4 w-4" />Voltar</a></Link>
        <div className="mt-6 flex items-start gap-3"><ShieldCheck className="mt-1 h-7 w-7 shrink-0 text-cyan-600 dark:text-cyan-300" /><div><h1 className="text-3xl font-black tracking-tight sm:text-4xl">{document.title}</h1><p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{document.intro}</p></div></div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Versão de 7 de setembro de 2026</p>
        <div className="mt-8 space-y-8">{document.sections.map(([title, paragraphs]) => <section key={title}><h2 className="text-xl font-bold">{title}</h2><div className="mt-3 space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300">{paragraphs.map(text => <p key={text}>{text}</p>)}</div></section>)}</div>
        <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950"><h2 className="font-bold">Responsável e contato</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{config.data?.responsibleName ?? "Projeto Vetor — responsável pelo tratamento de dados"}</p>{email ? <a href={`mailto:${email}`} className="mt-2 inline-block text-sm font-semibold text-cyan-700 hover:underline dark:text-cyan-300">{email}</a> : <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Canal de suporte em configuração.</p>}</section>
      </article>
    </main>
  );
}
