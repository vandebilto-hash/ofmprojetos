import NextAuth from "next-auth";
import { buildAuthOptions } from "@/lib/auth/options";

function handler(req: any, res: any) {
  return NextAuth(buildAuthOptions(req))(req, res);
}

export { handler as GET, handler as POST };
