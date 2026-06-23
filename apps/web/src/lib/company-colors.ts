const companyBadgeClasses = [
  "border-blue-100 bg-blue-50 text-blue-700",
  "border-emerald-100 bg-emerald-50 text-emerald-700",
  "border-violet-100 bg-violet-50 text-violet-700",
  "border-amber-100 bg-amber-50 text-amber-700",
  "border-rose-100 bg-rose-50 text-rose-700",
  "border-cyan-100 bg-cyan-50 text-cyan-700",
  "border-fuchsia-100 bg-fuchsia-50 text-fuchsia-700",
  "border-lime-100 bg-lime-50 text-lime-700",
];

export function getCompanyLabel(company?: string | null) {
  return company?.trim() || "Sem empresa";
}

export function getCompanyBadgeClass(company?: string | null) {
  const label = getCompanyLabel(company);
  const hash = Array.from(label).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return companyBadgeClasses[hash % companyBadgeClasses.length];
}
