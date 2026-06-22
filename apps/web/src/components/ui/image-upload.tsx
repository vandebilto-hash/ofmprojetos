"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

type ImageUploadProps = {
  name: string;
  defaultValue?: string | null;
  label?: string;
};

export function ImageUpload({ name, defaultValue, label = "Logo" }: ImageUploadProps) {
  const [preview, setPreview] = useState(defaultValue ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Arquivo muito grande. Máximo 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleClear() {
    setPreview("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input type="hidden" name={name} value={preview} />
      {preview ? (
        <div className="relative inline-block w-fit">
          <img src={preview} alt="Preview" className="h-16 w-16 rounded-lg object-contain ring-1 ring-line" />
          <button
            type="button"
            onClick={handleClear}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
            title="Remover imagem"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-20 w-40 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line text-sm text-slate-400 hover:border-brand-400 hover:text-brand-600"
        >
          <ImagePlus size={18} />
          Selecionar imagem
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleChange}
      />
    </label>
  );
}
