"use client";

import { useRef, useState } from "react";
import { FileUp, X } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

type UploadedFile = {
  name: string;
  fileUrl: string;
};

type MultiFileUploadProps = {
  name: string;
  label?: string;
  defaultValue?: UploadedFile[];
};

export function MultiFileUpload({ name, label = "Arquivos", defaultValue = [] }: MultiFileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files ?? []);
    if (!selectedFiles.length) return;
    const oversized = selectedFiles.find((file) => file.size > MAX_FILE_SIZE);
    if (oversized) {
      alert(`Arquivo muito grande: ${oversized.name}. O limite e 10 MB por arquivo.`);
      e.target.value = "";
      return;
    }

    const uploaded = await Promise.all(
      selectedFiles.map(
        (file) =>
          new Promise<UploadedFile>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ name: file.name, fileUrl: reader.result as string });
            reader.readAsDataURL(file);
          })
      )
    );

    setFiles((current) => [...current, ...uploaded]);
    e.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  }

  return (
    <div className="grid gap-1.5 text-sm font-medium">
      <span>{label}</span>
      <input type="hidden" name={name} value={JSON.stringify(files)} />
      <div className="grid gap-2 rounded-lg border border-dashed border-line bg-slate-50 p-3">
        {files.map((file, index) => (
          <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 ring-1 ring-line">
            <p className="min-w-0 truncate font-semibold text-ink">{file.name}</p>
            <button type="button" onClick={() => removeFile(index)} className="rounded-full p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Remover arquivo">
              <X size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-4 text-sm font-semibold text-slate-500 ring-1 ring-line hover:text-brand-700 hover:ring-brand-300"
        >
          <FileUp size={18} />
          Adicionar arquivos ate 10 MB
        </button>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={handleChange} />
      </div>
    </div>
  );
}
