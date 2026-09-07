# Naseemah-001

Simple user portal: create a User, log in, reset a forgotten password, then open Home.

The stack runs in Docker: web, API, Postgres, and Mailhog.

```bash
docker compose up --build
```

- App: http://localhost:5173
- Mailhog (reset emails): http://localhost:8025
- API health: http://localhost:3000/api/health

After login, Home shows Kuwait dinar rates from Postgres. The API refreshes them every hour when the network is up, and otherwise keeps the last snapshot (local file + GitHub copy).

Containers use `restart: unless-stopped`, so they come back after a reboot once Docker Desktop starts. A GitHub Action updates `apps/api/data/kuwait-rates.json` every hour even if this laptop is off. The website itself still needs this machine (or a host) to be on.

If an API file change does not reload, run `docker compose restart api`.
