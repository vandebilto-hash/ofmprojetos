"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { generateProjectShareLinkAction } from "@/server/actions/projects";

export function GenerateLinkButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await generateProjectShareLinkAction(projectId);
          router.refresh();
        })
      }
      className="mt-3 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {isPending ? "Gerando..." : "Gerar link publico"}
    </button>
  );
}
