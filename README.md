# Naseemah-001

Simple user portal: create a User, log in, reset a forgotten password, then open Home.

The stack runs in Docker: web, API, Postgres, and Mailhog.

```bash
docker compose up --build
```

- App: http://localhost:5173
- Mailhog (reset emails): http://localhost:8025
- API health: http://localhost:3000/api/health

If an API file change does not reload, run `docker compose restart api`.
