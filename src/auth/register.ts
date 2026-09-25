"use server";

import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db/client";

const registrationSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128),
});

export type RegistrationResult = { ok: boolean; message: string };

export async function registerStudent(
  _previous: RegistrationResult,
  formData: FormData,
): Promise<RegistrationResult> {
  const parsed = registrationSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, message: "Enter your name, a valid school email, and a password of at least 12 characters." };

  const email = parsed.data.email.toLowerCase();
  const allowedDomains = (process.env.STUDENT_EMAIL_DOMAINS ?? "")
    .split(",")
    .map((domain) => domain.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
  if (allowedDomains.length === 0) {
    return { ok: false, message: "Student registration is not configured yet." };
  }

  const emailDomain = email.split("@")[1];
  if (!allowedDomains.includes(emailDomain)) {
    return { ok: false, message: "Use an email address from a supported school." };
  }

  try {
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash: await hash(parsed.data.password, 12),
        role: "STUDENT",
        studentVerifiedAt: new Date(),
      },
    });
    return { ok: true, message: "Account created. You can now sign in." };
  } catch {
    return { ok: false, message: "We could not create the account. Check the email or try again." };
  }
}