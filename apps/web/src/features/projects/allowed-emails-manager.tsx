"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function AllowedEmailsManager({ shareLinkId, projectId, initialEmails }: { shareLinkId: string; projectId: string; initialEmails: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const emails: string[] = initialEmails ? initialEmails.split(",").map((e) => e.trim()).filter(Boolean) : [];

  function addEmail() {
    const email = input.trim().toLowerCase();
    if (!email) return;
    if (!email.includes("@")) { setError("E-mail invalido."); return; }
    if (emails.includes(email)) { setError("E-mail ja adicionado."); return; }

    setError(null);
    const updated = [...emails, email].join(", ");

    startTransition(async () => {
      await fetch("/api/portal/update-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareLinkId, projectId, allowedEmails: updated })
      });
      setInput("");
      router.refresh();
    });
  }

  function removeEmail(target: string) {
    const updated = emails.filter((e) => e !== target).join(", ");

    startTransition(async () => {
      await fetch("/api/portal/update-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareLinkId, projectId, allowedEmails: updated })
      });
      router.refresh();
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); addEmail(); }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="email"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="cliente@empresa.com"
          className="h-10 flex-1 rounded-md border border-line px-3 text-sm outline-none focus:border-brand-500"
          disabled={isPending}
        />
        <button
          type="button"
          onClick={addEmail}
          disabled={isPending || !input.trim()}
          className="h-10 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          +
        </button>
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {emails.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {emails.map((email) => (
            <span key={email} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
              {email}
              <button
                type="button"
                onClick={() => removeEmail(email)}
                disabled={isPending}
                className="ml-1 text-slate-400 hover:text-red-600"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      {emails.length === 0 && <p className="mt-2 text-xs text-slate-500">Nenhum e-mail restrito. Qualquer pessoa com o link pode acessar.</p>}
    </div>
  );
}
