import React, { useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { uploadToSignedStorageUrl } from "@/lib/signedStorageUpload";
import {
  isQuestionImageUrl,
  type StatementImage,
} from "@shared/questionImages";
import { MAX_QUESTION_IMPORT_IMAGE_BYTES } from "@shared/questionImportSchema";

export function StatementImagesPreview({
  images,
}: {
  images: StatementImage[];
}) {
  return (
    <div className="space-y-4">
      {images
        .filter(image => isQuestionImageUrl(image.url_imagem))
        .map(image => (
          <figure key={image.slot_id}>
            <img
              src={image.url_imagem}
              alt={image.texto_alternativo || "Imagem da questão"}
              loading="lazy"
              className="h-auto max-w-full rounded-xl border border-slate-200 bg-white dark:border-slate-700"
            />
            {image.legenda && (
              <figcaption className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {image.legenda}
              </figcaption>
            )}
          </figure>
        ))}
    </div>
  );
}

export function StatementImagesEditor({
  value,
  onChange,
  onBusyChange,
}: {
  value: StatementImage[];
  onChange: (images: StatementImage[]) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const prepare = trpc.admin.createAdminImageUpload.useMutation();
  const confirm = trpc.admin.confirmAdminStatementImage.useMutation();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const setImages = (images: StatementImage[]) =>
    onChange(images.map((image, ordem) => ({ ...image, ordem })));
  const image = (url_imagem: string): StatementImage => ({
    slot_id: crypto.randomUUID(),
    local: "enunciado",
    url_imagem,
    ordem: value.length,
    texto_alternativo: "",
    legenda: null,
  });

  async function upload(files: File[]) {
    setBusy(true);
    onBusyChange?.(true);
    setError("");
    let next = [...value];
    try {
      if (next.length + files.length > 30)
        throw new Error("Use no máximo 30 imagens no enunciado.");
      for (const file of files) {
        if (
          !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
          !/\.(png|jpe?g|webp)$/i.test(file.name)
        )
          throw new Error("Selecione PNG, JPEG ou WebP.");
        if (!file.size || file.size > MAX_QUESTION_IMPORT_IMAGE_BYTES)
          throw new Error("Cada imagem deve ter no máximo 3 MB.");
        const signed = await prepare.mutateAsync({
          bucket: "questoes-imagens",
          originalName: file.name,
          contentType: file.type as "image/png" | "image/jpeg" | "image/webp",
          purpose: "statement",
        });
        const sent = await uploadToSignedStorageUrl({
          bucket: signed.bucket,
          path: signed.path,
          token: signed.token,
          file,
          contentType: file.type,
        });
        if (sent.error) throw new Error("Não foi possível enviar a imagem.");
        const verified = await confirm.mutateAsync({
          path: signed.path,
          contentType: file.type as "image/png" | "image/jpeg" | "image/webp",
        });
        next = [...next, image(verified.publicUrl)];
        setImages(next);
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível enviar as imagens."
      );
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  }

  return (
    <fieldset
      disabled={busy}
      className="space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
    >
      <legend className="px-2 font-bold">Imagens do enunciado</legend>
      <p className="text-sm text-slate-500">
        Aparecem nesta ordem, entre o enunciado e a continuação. PNG, JPEG ou
        WebP, até 3 MB por imagem.
      </p>
      <label className="block text-sm font-semibold">
        Adicionar arquivos
        <input
          multiple
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="mt-2 block w-full text-sm"
          onChange={event => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            if (files.length) void upload(files);
          }}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          aria-label="URL de uma nova imagem"
          value={url}
          onChange={event => setUrl(event.target.value)}
          placeholder="https://…"
          className="min-w-0 flex-1 rounded-xl border bg-transparent p-2 text-sm"
        />
        <Button
          type="button"
          variant="outline"
          disabled={value.length >= 30}
          onClick={() => {
            if (!isQuestionImageUrl(url)) {
              setError("Informe uma URL HTTPS válida.");
              return;
            }
            setImages([...value, image(url.trim())]);
            setUrl("");
            setError("");
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar URL
        </Button>
      </div>
      {busy && (
        <p role="status">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
          Enviando e validando imagens…
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {value.map((item, index) => (
        <div
          key={item.slot_id}
          className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700"
        >
          <p className="text-sm font-semibold">
            Imagem {index + 1}
            {item.local === "contexto" ? " · contexto" : ""}
          </p>
          <StatementImagesPreview images={[item]} />
          <label className="block text-sm">
            URL
            <input
              aria-label={`URL da imagem ${index + 1}`}
              value={item.url_imagem}
              onChange={event =>
                setImages(
                  value.map((entry, i) =>
                    i === index
                      ? { ...entry, url_imagem: event.target.value }
                      : entry
                  )
                )
              }
              className="mt-1 w-full rounded-lg border bg-transparent p-2"
            />
          </label>
          <label className="block text-sm">
            Texto alternativo
            <input
              maxLength={500}
              value={item.texto_alternativo}
              onChange={event =>
                setImages(
                  value.map((entry, i) =>
                    i === index
                      ? { ...entry, texto_alternativo: event.target.value }
                      : entry
                  )
                )
              }
              className="mt-1 w-full rounded-lg border bg-transparent p-2"
            />
          </label>
          <label className="block text-sm">
            Legenda (opcional)
            <input
              maxLength={500}
              value={item.legenda || ""}
              onChange={event =>
                setImages(
                  value.map((entry, i) =>
                    i === index
                      ? { ...entry, legenda: event.target.value || null }
                      : entry
                  )
                )
              }
              className="mt-1 w-full rounded-lg border bg-transparent p-2"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {([-1, 1] as const).map(direction => (
              <Button
                type="button"
                key={direction}
                variant="outline"
                size="sm"
                disabled={
                  index + direction < 0 || index + direction >= value.length
                }
                onClick={() => {
                  const reordered = [...value];
                  [reordered[index], reordered[index + direction]] = [
                    reordered[index + direction],
                    reordered[index],
                  ];
                  setImages(reordered);
                }}
              >
                {direction < 0 ? (
                  <ArrowUp className="mr-1 h-4 w-4" />
                ) : (
                  <ArrowDown className="mr-1 h-4 w-4" />
                )}
                {direction < 0 ? "Subir" : "Descer"}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setImages(value.filter((_, i) => i !== index))}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Remover
            </Button>
          </div>
        </div>
      ))}
    </fieldset>
  );
}
