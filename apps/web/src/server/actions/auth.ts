"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
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

const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail invalido.")
});

export async function forgotPasswordAction(formData: FormData) {
  const data = forgotPasswordSchema.parse(Object.fromEntries(formData));
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user) {
    return { message: "Se o e-mail estiver cadastrado, voce recebera um link de recuperacao." };
  }

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, used: false }
  });

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expires
    }
  });

  const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`;

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      entityType: "User",
      entityId: user.id,
      action: "FORGOT_PASSWORD"
    }
  });

  console.log(`[RESET PASSWORD] URL de recuperacao para ${user.email}: ${resetUrl}`);

  return {
    message: "Se o e-mail estiver cadastrado, voce recebera um link de recuperacao.",
    resetUrl
  };
}

const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    newPassword: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(8)
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "A confirmacao precisa ser igual a nova senha.",
    path: ["confirmPassword"]
  });

export async function resetPasswordAction(formData: FormData) {
  const data = resetPasswordSchema.parse(Object.fromEntries(formData));

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: data.token },
    include: { user: true }
  });

  if (!resetToken || resetToken.used || resetToken.expires < new Date()) {
    throw new Error("Token invalido ou expirado. Solicite uma nova recuperacao de senha.");
  }

  const passwordHash = await bcrypt.hash(data.newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash, mustChangePassword: false }
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true }
    }),
    prisma.auditLog.create({
      data: {
        actorId: resetToken.userId,
        entityType: "User",
        entityId: resetToken.userId,
        action: "RESET_PASSWORD"
      }
    })
  ]);

  redirect("/login?reset=success");
}

const registerSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
    email: z.string().email("E-mail invalido."),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(8)
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "A confirmacao precisa ser igual a senha.",
    path: ["confirmPassword"]
  });

export async function registerAction(formData: FormData) {
  const data = registerSchema.parse(Object.fromEntries(formData));

  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw new Error("Este e-mail ja esta cadastrado.");
  }

  const clientRole = await prisma.role.findUnique({ where: { name: "CLIENT" } });
  if (!clientRole) {
    throw new Error("Role CLIENT nao encontrada no sistema.");
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      roleId: clientRole.id,
      status: "ACTIVE",
      mustChangePassword: false
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      entityType: "User",
      entityId: user.id,
      action: "REGISTER",
      description: `Cadastro via formulário publico.`
    }
  });

  redirect("/login?registered=success");
}
