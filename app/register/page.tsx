import Link from "next/link";
import { RegistrationForm } from "../_components/auth-forms";

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <p className="eyebrow">Student account</p>
      <h1>Create your account</h1>
      <RegistrationForm />
      <Link className="back-link" href="/login">Already registered? Sign in</Link>
    </main>
  );
}