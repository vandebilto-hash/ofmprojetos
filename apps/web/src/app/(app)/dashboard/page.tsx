import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { DashboardPage } from "@/features/dashboard/dashboard-page";

export default async function DashboardRoute() {
  const session = await getServerSession(authOptions);
  return (
    <DashboardPage
      role={session?.user.role ?? "EMPLOYEE"}
      userId={session?.user.id ?? ""}
      clientId={session?.user.clientId}
    />
  );
}
