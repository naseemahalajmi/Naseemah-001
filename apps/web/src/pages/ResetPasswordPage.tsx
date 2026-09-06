import { FormEvent, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { completePasswordReset } from "../api";

export function ResetPasswordPage() {
  const { token: tokenParam } = useParams();
  const [params] = useSearchParams();
  const token = tokenParam ?? params.get("token") ?? "";
  const navigate = useNavigate();
  const [error, setError] = useState(token ? "" : "This reset link is missing a token.");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    setError("");
    try {
      await completePasswordReset(token, password);
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h1 className="wordmark" style={{ fontSize: 22 }}>
        Set a new password
      </h1>
      {error ? <p className="error">{error}</p> : null}
      <label htmlFor="password">New password</label>
      <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
      <label htmlFor="confirm">Confirm password</label>
      <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
      <button type="submit" disabled={pending || !token}>
        {pending ? "Saving…" : "Save password"}
      </button>
      <div className="links">
        <Link to="/login">Login</Link>
      </div>
    </form>
  );
}
