import Link from "next/link";
import { LoginForm } from "../_components/auth-forms";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <p className="eyebrow">Student account</p>
      <h1>Sign in to FoodWise</h1>
      <LoginForm />
      <Link className="back-link" href="/#discover">Browse meals</Link>
    </main>
  );
}