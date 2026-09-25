"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginStudent, type LoginResult } from "../../src/auth/login";
import { registerStudent, type RegistrationResult } from "../../src/auth/register";

const loginInitial: LoginResult = { message: "" };
const registrationInitial: RegistrationResult = { ok: false, message: "" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginStudent, loginInitial);
  return (
    <form action={formAction} className="auth-form">
      <label htmlFor="login-email">School email</label>
      <input id="login-email" name="email" type="email" autoComplete="email" required />
      <label htmlFor="login-password">Password</label>
      <input id="login-password" name="password" type="password" autoComplete="current-password" required />
      <button type="submit" disabled={pending}>{pending ? "Signing in..." : "Sign in"}</button>
      <p role="status" aria-live="polite">{state.message}</p>
      <p>New to FoodWise? <Link href="/register">Create a student account</Link></p>
    </form>
  );
}

export function RegistrationForm() {
  const [state, formAction, pending] = useActionState(registerStudent, registrationInitial);
  return (
    <form action={formAction} className="auth-form">
      <label htmlFor="register-name">Name</label>
      <input id="register-name" name="name" autoComplete="name" maxLength={100} required />
      <label htmlFor="register-email">School email</label>
      <input id="register-email" name="email" type="email" autoComplete="email" maxLength={254} required />
      <label htmlFor="register-password">Password</label>
      <input id="register-password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
      <p className="field-help">Use at least 12 characters. Student eligibility is based on a supported school email domain.</p>
      <button type="submit" disabled={pending}>{pending ? "Creating account..." : "Create account"}</button>
      <p role="status" aria-live="polite">{state.message}</p>
      {state.ok && <Link href="/login">Continue to sign in</Link>}
    </form>
  );
}