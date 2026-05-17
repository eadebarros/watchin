"use client";

import { useRef, useState } from "react";

interface Props {
  onFile: (file: File) => void;
  loading: boolean;
}

export function CsvUpload({ onFile, loading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handle = (file: File) => {
    if (!file.name.endsWith(".csv")) return;
    setFileName(file.name);
    onFile(file);
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handle(file);
        }}
        className={`
          border-2 border-dashed rounded-xl px-6 py-10 text-center cursor-pointer transition-all
          ${dragging ? "border-amber-500 bg-amber-500/5" : "border-zinc-700 hover:border-zinc-500"}
          ${loading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); }}
        />
        <p className="text-4xl mb-3">📄</p>
        {fileName ? (
          <p className="text-amber-400 font-medium text-sm">{fileName}</p>
        ) : (
          <>
            <p className="text-white font-medium">Arraste o CSV aqui ou clique para selecionar</p>
            <p className="text-zinc-500 text-sm mt-1">Arquivo exportado do IMDb</p>
          </>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-400 space-y-1">
        <p className="text-zinc-300 font-medium mb-2">Como exportar do IMDb:</p>
        <p>1. Acesse <span className="text-amber-500/80">imdb.com</span> e vá em <strong>Seus ratings</strong></p>
        <p>2. Clique nos três pontos <strong>···</strong> no topo da lista</p>
        <p>3. Selecione <strong>Exportar</strong></p>
      </div>
    </div>
  );
}
