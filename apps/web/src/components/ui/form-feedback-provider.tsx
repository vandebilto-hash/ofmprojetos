"use client";

import { useEffect } from "react";

const feedbackClass = "rounded-md border px-3 py-2 text-sm font-semibold";
const successClass = `${feedbackClass} border-emerald-200 bg-emerald-50 text-emerald-800`;
const errorClass = `${feedbackClass} border-red-200 bg-red-50 text-red-800`;

function dispatchToast(message: string, type: "success" | "error" = "success") {
  window.dispatchEvent(new CustomEvent("projete:toast", { detail: { message, type } }));
}

function getFeedbackNode(form: HTMLFormElement) {
  let node = form.querySelector<HTMLElement>("[data-form-feedback-message]");
  if (!node) {
    node = document.createElement("div");
    node.setAttribute("data-form-feedback-message", "true");
    node.setAttribute("role", "status");
    node.setAttribute("aria-live", "polite");
    form.prepend(node);
  }
  return node;
}

function shouldHandleForm(form: HTMLFormElement) {
  if (form.dataset.formFeedback === "off") return false;
  if (form.closest("dialog")) return true;
  return form.hasAttribute("action") || Boolean(form.getAttribute("action"));
}

function setSubmitDisabled(form: HTMLFormElement, disabled: boolean) {
  form.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button[type="submit"], button:not([type]), input[type="submit"]').forEach((button) => {
    button.disabled = disabled;
  });
}

function resetForm(form: HTMLFormElement) {
  if (form.dataset.preserveValues === "true") return;
  window.setTimeout(() => form.reset(), 250);
}

export function FormFeedbackProvider() {
  useEffect(() => {
    function handleInvalid(event: Event) {
      const field = event.target as HTMLElement | null;
      const form = field?.closest("form") as HTMLFormElement | null;
      if (!form || form.dataset.formFeedback === "off") return;

      const node = getFeedbackNode(form);
      node.className = errorClass;
      node.textContent = "Revise os campos obrigatórios antes de salvar.";
      dispatchToast("Revise os campos obrigatórios antes de salvar.", "error");
    }

    function handleSubmit(event: SubmitEvent) {
      const form = event.target as HTMLFormElement | null;
      if (!form || !shouldHandleForm(form)) return;

      const node = getFeedbackNode(form);
      if (!form.checkValidity()) {
        node.className = errorClass;
        node.textContent = "Revise os campos obrigatórios antes de salvar.";
        dispatchToast("Revise os campos obrigatórios antes de salvar.", "error");
        return;
      }

      node.className = successClass;
      node.textContent = "Processando...";
      setSubmitDisabled(form, true);

      window.setTimeout(() => {
        node.className = successClass;
        node.textContent = "Operação realizada com sucesso.";
        dispatchToast("Operação realizada com sucesso.");
        resetForm(form);
      }, 450);

      window.setTimeout(() => setSubmitDisabled(form, false), 1200);
    }

    document.addEventListener("invalid", handleInvalid, true);
    document.addEventListener("submit", handleSubmit, true);
    return () => {
      document.removeEventListener("invalid", handleInvalid, true);
      document.removeEventListener("submit", handleSubmit, true);
    };
  }, []);

  return null;
}
