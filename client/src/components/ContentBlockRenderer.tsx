import { MathFormula } from "@/components/MathFormula";
import type { ContentBlockRow, ContentBlockItem } from "@/services/contentPages.service";

function getInfoBoxClasses(variant?: string | null) {
  const value = (variant || "").toLowerCase();

  if (value === "blue") {
    return "bg-blue-50 border-l-4 border-blue-500 text-slate-700";
  }

  if (value === "indigo") {
    return "bg-indigo-50 border-l-4 border-indigo-500 text-slate-700";
  }

  if (value === "yellow") {
    return "bg-yellow-50 border-l-4 border-yellow-500 text-slate-700";
  }

  if (value === "green") {
    return "bg-emerald-50 border-l-4 border-emerald-500 text-slate-700";
  }

  if (value === "orange") {
    return "bg-orange-50 border-l-4 border-orange-500 text-slate-700";
  }

  return "bg-slate-50 border-l-4 border-slate-400 text-slate-700";
}

function renderGridItem(item: ContentBlockItem, cardVariant?: string) {
  const variant = (cardVariant || "").toLowerCase();

  const cardClass =
    variant === "soft"
      ? "bg-slate-50 border border-slate-200"
      : "bg-white border border-slate-200 shadow-sm";

  return (
    <div key={`${item.title || ""}-${item.content || ""}`} className={`rounded-xl p-5 ${cardClass}`}>
      {item.title ? (
        <h4 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h4>
      ) : null}

      {item.content ? <p className="text-slate-700 leading-relaxed">{item.content}</p> : null}

      {item.formula ? (
        <div className="mt-4">
          <MathFormula formula={item.formula} display />
        </div>
      ) : null}

      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.title || "Imagem do bloco"}
          className="mt-4 rounded-lg border border-slate-200"
        />
      ) : null}
    </div>
  );
}

export default function ContentBlockRenderer({
  block,
}: {
  block: ContentBlockRow;
}) {
  const settings = block.settings_json || {};

  if (block.type === "section_card") {
    return (
      <section className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 md:p-8">
        {block.title ? (
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">{block.title}</h2>
        ) : null}

        {block.content ? (
          <div className="text-slate-700 leading-relaxed whitespace-pre-line">{block.content}</div>
        ) : null}

        {block.formula ? (
          <div className="mt-5">
            <MathFormula formula={block.formula} display />
          </div>
        ) : null}

        {block.image_url ? (
          <img
            src={block.image_url}
            alt={block.title || "Imagem da seção"}
            className="mt-5 rounded-xl border border-slate-200"
          />
        ) : null}
      </section>
    );
  }

  if (block.type === "text_block") {
    return (
      <section className="space-y-4">
        {block.title ? (
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{block.title}</h2>
        ) : null}

        {block.content ? (
          <div className="text-slate-700 leading-relaxed whitespace-pre-line">{block.content}</div>
        ) : null}

        {block.formula ? <MathFormula formula={block.formula} display /> : null}
      </section>
    );
  }

  if (block.type === "info_box") {
    return (
      <section className={`rounded-xl p-5 ${getInfoBoxClasses(block.variant)}`}>
        {block.title ? <h3 className="text-xl font-bold mb-2">{block.title}</h3> : null}
        {block.content ? <div className="leading-relaxed whitespace-pre-line">{block.content}</div> : null}
        {block.formula ? (
          <div className="mt-4">
            <MathFormula formula={block.formula} display />
          </div>
        ) : null}
      </section>
    );
  }

  if (block.type === "highlight_dark") {
    return (
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 rounded-2xl p-6 md:p-8 shadow-xl">
        {block.title ? (
          <h3 className="text-2xl font-bold mb-4 text-white">{block.title}</h3>
        ) : null}

        {block.content ? (
          <div className="leading-relaxed whitespace-pre-line text-slate-200">{block.content}</div>
        ) : null}

        {block.formula ? (
          <div className="mt-5 bg-slate-800/70 rounded-xl p-4">
            <MathFormula formula={block.formula} display />
          </div>
        ) : null}

        {block.image_url ? (
          <img
            src={block.image_url}
            alt={block.title || "Imagem do destaque"}
            className="mt-5 rounded-xl border border-slate-700"
          />
        ) : null}
      </section>
    );
  }

  if (block.type === "formula_box") {
    const align = settings.align || "center";
    const alignClass =
      align === "left"
        ? "text-left"
        : align === "right"
        ? "text-right"
        : "text-center";

    const isDark = (block.variant || "").includes("dark");

    return (
      <section
        className={`rounded-xl p-5 ${
          isDark
            ? "bg-slate-800/70 text-slate-100 border border-slate-700"
            : "bg-slate-50 text-slate-800 border border-slate-200"
        }`}
      >
        {block.title ? <h4 className={`text-lg font-bold mb-2 ${alignClass}`}>{block.title}</h4> : null}

        {block.content ? (
          <div className={`leading-relaxed whitespace-pre-line mb-4 ${alignClass}`}>{block.content}</div>
        ) : null}

        {block.formula ? <MathFormula formula={block.formula} display /> : null}
      </section>
    );
  }

  if (block.type === "cards_grid") {
    const items = Array.isArray(block.items_json) ? block.items_json : [];
    const columns = settings.columns || 2;

    const gridClass =
      columns === 3
        ? "md:grid-cols-2 xl:grid-cols-3"
        : columns === 1
        ? "grid-cols-1"
        : "md:grid-cols-2";

    return (
      <section className="space-y-4">
        {block.title ? (
          <h3 className="text-2xl font-bold text-slate-900">{block.title}</h3>
        ) : null}

        <div className={`grid gap-4 ${gridClass}`}>
          {items.map((item) => renderGridItem(item, settings.cardVariant))}
        </div>
      </section>
    );
  }

  return null;
}
