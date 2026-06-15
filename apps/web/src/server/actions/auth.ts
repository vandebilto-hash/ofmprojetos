"use server";

import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma/client";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8)
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "A confirmacao precisa ser igual a nova senha.",
    path: ["confirmPassword"]
  });

export async function changeRequiredPasswordAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) throw new Error("Usuario nao autenticado.");

  const data = changePasswordSchema.parse(Object.fromEntries(formData));
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (!user.passwordHash) throw new Error("Este usuario nao possui senha local cadastrada.");

  const currentPasswordValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
  if (!currentPasswordValid) throw new Error("Senha atual invalida.");

  const samePassword = await bcrypt.compare(data.newPassword, user.passwordHash);
  if (samePassword) throw new Error("A nova senha precisa ser diferente da senha atual.");

  const passwordHash = await bcrypt.hash(data.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      mustChangePassword: false
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      entityType: "User",
      entityId: user.id,
      action: "CHANGE_REQUIRED_PASSWORD"
    }
  });

  revalidatePath("/change-password");
  redirect("/dashboard");
}
