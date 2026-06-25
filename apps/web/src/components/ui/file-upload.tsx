"use client";

import { useRef, useState } from "react";
import { FileUp, X } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

type FileUploadProps = {
  name: string;
  defaultValue?: string | null;
  label?: string;
  required?: boolean;
};

export function FileUpload({ name, defaultValue, label = "Arquivo", required = false }: FileUploadProps) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [fileName, setFileName] = useState(defaultValue ? "Arquivo/link atual preservado" : "");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      alert("Arquivo muito grande. O limite e 10 MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setValue(reader.result as string);
      setFileName(file.name);
    };
    reader.readAsDataURL(file);
  }

  function handleClear() {
    setValue("");
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
      <span>{label}</span>
      <input type="hidden" name={name} value={value} required={required} />
      <div className="rounded-lg border border-dashed border-line bg-slate-50 p-3">
        {value ? (
          <div className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 ring-1 ring-line">
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{fileName || "Arquivo selecionado"}</p>
              <p className="text-xs font-normal text-slate-500">Envie outro arquivo para substituir. Links antigos sao mantidos.</p>
            </div>
            <button type="button" onClick={handleClear} className="rounded-full p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Remover arquivo">
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-5 text-sm font-semibold text-slate-500 ring-1 ring-line hover:text-brand-700 hover:ring-brand-300"
          >
            <FileUp size={18} />
            Selecionar arquivo ate 10 MB
          </button>
        )}
        <input ref={inputRef} type="file" className="hidden" onChange={handleChange} />
      </div>
    </div>
  );
}
