"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "../auth";

export type LoginResult = { message: string };

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1).max(128) });

export async function loginStudent(_previous: LoginResult, formData: FormData): Promise<LoginResult> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { message: "Enter a valid email and password." };
  try {
    await signIn("credentials", {
      email: parsed.data.email.trim().toLowerCase(),
      password: parsed.data.password,
      redirectTo: "/cart",
    });
    return { message: "Signed in." };
  } catch (error) {
    if (error instanceof AuthError) return { message: "Email or password is incorrect." };
    throw error;
  }
}