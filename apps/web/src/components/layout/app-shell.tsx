"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  FileBarChart,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Shield,
  UsersRound,
  Clock,
  Menu,
  X
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useState } from "react";
import { clsx } from "clsx";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projetos", icon: BriefcaseBusiness },
  { href: "/tasks", label: "Tarefas", icon: FolderKanban },
  { href: "/resources", label: "Recursos", icon: UsersRound },
  { href: "/time-entries", label: "Horas", icon: Clock },
  { href: "/reports", label: "Relatórios", icon: FileBarChart },
  { href: "/admin", label: "Administração", icon: Shield },
  { href: "/admin/settings", label: "Configurações", icon: Settings }
];

function NavLink({ href, label, icon: Icon, onClick }: { href: string; label: string; icon: typeof LayoutDashboard; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={clsx(
        "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-fast",
        isActive
          ? "nav-item-active"
          : "text-slate-600 hover:bg-brand-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-100"
      )}
    >
      <Icon size={17} className="shrink-0" />
      {label}
    </Link>
  );
}

function Sidebar({ userName, userRole, onClose }: { userName?: string; userRole?: string; onClose?: () => void }) {
  return (
    <aside className="flex h-full flex-col bg-white dark:bg-[#111c31]">
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-line px-5 py-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-100/70">
            OFM Systems
          </p>
          <h1 className="mt-0.5 text-lg font-bold leading-tight text-ink dark:text-white">
            Gestão de Projetos
          </h1>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3" aria-label="Navegação principal">
        <div className="grid gap-0.5">
          {nav.map((item) => (
            <NavLink key={item.href} {...item} onClick={onClose} />
          ))}
        </div>
      </nav>

      {/* Footer user info */}
      <div className="border-t border-line p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
            {userName?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink dark:text-white">{userName}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{userRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function AppShell({
  children,
  userName,
  userRole
}: {
  children: React.ReactNode;
  userName?: string;
  userRole?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-canvas dark:bg-[#0f172a]">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <div
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-line shadow-dropdown transition-transform duration-slow lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar userName={userName} userRole={userRole} onClose={() => setMobileOpen(false)} />
      </div>

      {/* Desktop layout */}
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[260px_1fr]">
        {/* Desktop sidebar */}
        <div className="hidden border-r border-line lg:block">
          <div className="sticky top-0 h-screen overflow-hidden">
            <Sidebar userName={userName} userRole={userRole} />
          </div>
        </div>

        {/* Main content */}
        <div className="min-w-0">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur dark:bg-[#111c31]/95 lg:px-6">
            <button
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-3 lg:ml-auto">
              <ThemeToggle />
            </div>
          </header>
          <main className="min-w-0 max-w-full overflow-x-hidden p-4 animate-fadeIn lg:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
