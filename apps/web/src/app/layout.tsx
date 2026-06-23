import type { Metadata } from "next";
import { FormFeedbackProvider } from "@/components/ui/form-feedback-provider";
import { ToastProvider } from "@/components/ui/toast-provider";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Projete-se",
  description: "Sistema interno de gerenciamento de projetos"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem("projete-theme");
                var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                if ((theme || (prefersDark ? "dark" : "light")) === "dark") {
                  document.documentElement.classList.add("dark");
                  document.documentElement.dataset.theme = "dark";
                } else {
                  document.documentElement.dataset.theme = "light";
                }
              } catch (_) {}
            `
          }}
        />
      </head>
      <body>
        <FormFeedbackProvider />
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
