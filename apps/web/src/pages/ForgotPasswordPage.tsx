import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../api";

export function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      await requestPasswordReset(String(form.get("email") ?? ""));
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h1 className="wordmark" style={{ fontSize: 22 }}>
        Forgot password
      </h1>
      {error ? <p className="error">{error}</p> : null}
      {sent ? (
        <p className="notice">
          If that email belongs to a User, a reset link is in Mailhog at{" "}
          <a href="http://localhost:8025" target="_blank" rel="noreferrer">
            localhost:8025
          </a>
          .
        </p>
      ) : null}
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" required autoComplete="email" />
      <button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
      <div className="links">
        <Link to="/login">Login</Link>
      </div>
    </form>
  );
}
