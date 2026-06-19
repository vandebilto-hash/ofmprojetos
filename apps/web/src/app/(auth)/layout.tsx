export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas dark:bg-[#0f172a]">
      {children}
    </div>
  );
}
