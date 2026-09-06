import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api";

export function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      await login({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      });
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log in.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h1 className="wordmark" style={{ fontSize: 22 }}>
        Login
      </h1>
      {error ? <p className="error">{error}</p> : null}
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" required autoComplete="email" />
      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" required autoComplete="current-password" />
      <button type="submit" disabled={pending}>
        {pending ? "Checking…" : "Login"}
      </button>
      <div className="links">
        <Link to="/create-user">Create user</Link>
        <Link to="/forgot-password">Forgot password</Link>
      </div>
    </form>
  );
}
