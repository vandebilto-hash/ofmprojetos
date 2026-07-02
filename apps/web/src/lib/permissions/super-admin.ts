type SuperAdminCandidate = {
  email?: string | null;
} | null | undefined;

const fallbackSuperAdminEmails = [
  "vandebilto.junior@ofm.com.br",
  "vandebilto.sarmento@ofm.com.br"
];

export function isSuperAdminUser(user: SuperAdminCandidate) {
  const email = user?.email?.trim().toLowerCase();
  if (!email) return false;

  const configuredEmails = (process.env.SUPERADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  const allowedEmails = configuredEmails.length ? configuredEmails : fallbackSuperAdminEmails;
  return allowedEmails.includes(email);
}
