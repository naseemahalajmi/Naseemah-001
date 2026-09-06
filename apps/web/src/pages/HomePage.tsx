import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { me, signOut, type UserPublic } from "../api";

export function HomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    me()
      .then(setUser)
      .catch(() => navigate("/login"))
      .finally(() => setLoading(false));
  }, [navigate]);

  async function onSignOut() {
    await signOut();
    navigate("/login");
  }

  if (loading || !user) {
    return <div className="card">Opening Home…</div>;
  }

  return (
    <div className="card">
      <h1 className="wordmark" style={{ fontSize: 22 }}>
        Home
      </h1>
      <p className="meta">Signed in as {user.displayName}</p>
      <p className="meta">{user.email}</p>
      <button type="button" onClick={onSignOut}>
        Sign out
      </button>
    </div>
  );
}
