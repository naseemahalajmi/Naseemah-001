import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { kuwaitRates, me, signOut, type KuwaitRatesSnapshot, type UserPublic } from "../api";

function formatWhen(value: string | null): string {
  if (!value) {
    return "not yet";
  }
  return new Date(value).toLocaleString();
}

export function HomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserPublic | null>(null);
  const [rates, setRates] = useState<KuwaitRatesSnapshot | null>(null);
  const [ratesError, setRatesError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    me()
      .then(async (signedIn) => {
        setUser(signedIn);
        try {
          setRates(await kuwaitRates());
        } catch (err) {
          setRatesError(err instanceof Error ? err.message : "Could not load Kuwait rates.");
        }
      })
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

      <h2 className="rates-title">Kuwait dinar rates</h2>
      {ratesError ? <p className="error">{ratesError}</p> : null}
      {rates && rates.rates.length === 0 ? (
        <p className="meta">The first hourly pull has not landed yet.</p>
      ) : null}
      {rates && rates.rates.length > 0 ? (
        <>
          <p className="meta">
            KWD table stored in our database and refreshed every hour when a
            network is available. If this machine is offline, Home still shows
            the last snapshot.
            {rates.publishedLabel ? ` · ${rates.publishedLabel}` : ""}
          </p>
          <p className="meta">Last pull: {formatWhen(rates.fetchedAt)}</p>
          <p className="meta">Next pull: {formatWhen(rates.nextRefreshAt)}</p>
          <table className="rates">
            <thead>
              <tr>
                <th>Currency</th>
                <th>Fils / unit</th>
                <th>KWD</th>
              </tr>
            </thead>
            <tbody>
              {rates.rates.map((rate) => {
                const fils = Number(rate.filsPerUnit);
                return (
                  <tr key={rate.currencyCode}>
                    <td>
                      {rate.currencyCode}
                      <span className="rate-name"> {rate.currencyName}</span>
                    </td>
                    <td>{rate.filsPerUnit}</td>
                    <td>{Number.isFinite(fils) ? (fils / 1000).toFixed(6) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="meta">
            <a href={rates.sourceUrl} target="_blank" rel="noreferrer">
              open.er-api.com source
            </a>
          </p>
        </>
      ) : null}

      <button type="button" onClick={onSignOut}>
        Sign out
      </button>
    </div>
  );
}
