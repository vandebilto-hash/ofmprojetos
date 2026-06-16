import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  BriefcaseBusiness,
  FileBarChart,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Shield,
  UsersRound
} from "lucide-react";
import { authOptions } from "@/lib/auth/options";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projetos", icon: BriefcaseBusiness },
  { href: "/tasks", label: "Tarefas", icon: FolderKanban },
  { href: "/resources", label: "Recursos", icon: UsersRound },
  { href: "/reports", label: "Relatorios", icon: FileBarChart },
  { href: "/admin", label: "Administracao", icon: Shield },
  { href: "/admin/settings", label: "Configuracoes", icon: Settings }
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.mustChangePassword) redirect("/change-password");

  return (
    <div className="grid min-h-screen grid-cols-[260px_1fr] bg-canvas">
      <aside className="sticky top-0 h-screen border-r border-line bg-white">
        <div className="border-b border-line px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            Projete-se
          </p>
          <h1 className="mt-1 text-xl font-bold text-ink">Gestao de Projetos</h1>
        </div>
        <nav className="grid gap-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700"
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-white/95 px-6 backdrop-blur">
          <div>
            <p className="text-sm font-semibold text-ink">{session.user.name}</p>
            <p className="text-xs text-slate-500">{session.user.role}</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <ThemeToggle />
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
