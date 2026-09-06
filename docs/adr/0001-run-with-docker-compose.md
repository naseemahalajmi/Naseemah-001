# Run the app with Docker Compose

Local Node plus a hosted database would split the stack. We run web, API, Postgres, and Mailhog through Docker Compose so one command matches how the services talk in deployment, and Forgot password has a real inbox (Mailhog) without a cloud email vendor.
