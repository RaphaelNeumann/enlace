"use client";

import { useState, useTransition } from "react";
import { signUploadAction } from "@/app/(admin)/admin/_actions/upload";

export interface UploadFieldProps {
  bucket: "site" | "gallery" | "gifts";
  /** Name of the hidden input that receives the storage path on success. */
  pathFieldName: string;
  defaultPath?: string | null;
  label?: string;
}

export function UploadField({ bucket, pathFieldName, defaultPath, label }: UploadFieldProps) {
  const [path, setPath] = useState<string>(defaultPath ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onPick(file: File | null | undefined) {
    if (!file) return;
    setError(null);
    startTransition(async () => {
      const signed = await signUploadAction(bucket, file.name);
      if (!signed.ok) {
        if (signed.error === "not_configured") setError("Storage não configurado.");
        else if (signed.error === "forbidden") setError("Sem permissão.");
        else if (signed.error === "invalid_input") setError("Arquivo inválido.");
        else setError(`Falha no upload: ${signed.message}`);
        return;
      }
      const put = await fetch(signed.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!put.ok) {
        setError(`Upload retornou ${put.status}.`);
        return;
      }
      setPath(signed.storagePath);
    });
  }

  return (
    <div className="space-y-2 text-sm">
      <label className="font-medium block">{label ?? "Imagem"}</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onPick(e.currentTarget.files?.[0])}
        disabled={pending}
        className="block text-sm"
      />
      <input
        type="text"
        name={pathFieldName}
        value={path}
        onChange={(e) => setPath(e.target.value)}
        placeholder="Ou cole o caminho no Storage"
        className="w-full rounded border px-3 py-2 text-sm"
      />
      {pending ? <p className="text-xs opacity-70">Enviando...</p> : null}
      {error ? <p className="text-xs" style={{ color: "var(--color-accent)" }}>{error}</p> : null}
    </div>
  );
}
