import { format } from "date-fns";

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "-";
  return format(new Date(value), "dd/MM/yyyy");
}

export function formatHours(value: unknown) {
  const number = Number(value ?? 0);
  return `${number.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}h`;
}

export function formatMoney(value: unknown) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}
