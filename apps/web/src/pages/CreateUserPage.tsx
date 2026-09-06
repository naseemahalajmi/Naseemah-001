import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUser } from "../api";

export function CreateUserPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
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
      await createUser({
        displayName: String(form.get("displayName") ?? ""),
        email: String(form.get("email") ?? ""),
        password,
      });
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create user.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h1 className="wordmark" style={{ fontSize: 22 }}>
        Create user
      </h1>
      {error ? <p className="error">{error}</p> : null}
      <label htmlFor="displayName">Display name</label>
      <input id="displayName" name="displayName" required maxLength={80} />
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" required autoComplete="email" />
      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
      <label htmlFor="confirm">Confirm password</label>
      <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
      <button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create user"}
      </button>
      <div className="links">
        <Link to="/login">Login</Link>
      </div>
    </form>
  );
}
