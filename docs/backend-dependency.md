# Website backend dependency

The [website repository](https://github.com/kerryhatcher/www.civpulse.org) owns
Civic Pulse's database schema, RLS policies, RPCs, Supabase configuration, seed
data and database tests. Maintain and apply migrations there. This repository
contains the plugin package and MCP source, with no copy of the database backend.

Plugin tools call those RPCs and tables through MCP using the connected user's
OAuth token. Research depends on visibility rules; content writes and account
administration depend on the website's admin checks. Installing the plugin
against the hosted service requires no local database or migrations.

## Local integration tests

Clone/update the website repository and follow its current README and development
documentation. With Bun and a Docker-compatible engine available, run these
commands **from the website checkout**:

```sh
bun install --frozen-lockfile
bun run db:start
bun run db:migrate
bun run db:seed-user
```

Use `db:status` there to check the local stack. Keep the existing local database;
`db:reset` erases its data and affects every checkout sharing that stack. The
plugin repository intentionally has no database start/reset/migrate/seed scripts.

Then run from **civpulse-openai**:

```sh
CIVPULSE_WEBSITE_DIR=/absolute/path/to/www.civpulse.org bun run mcp:test
```

The test runner requires an explicit website path, checks for its Supabase
configuration and asks the CLI for that checkout's local stack status using
`--workdir`. It continues to run this repository's MCP implementation and test
fixtures. Hosted backend URLs are rejected. No connection credentials are copied
into this repository. Tests create and remove local users and civic fixtures;
do not run competing integration suites against the same fixtures/ports.

Schema/RPC changes must land in the website repository before dependent MCP
changes are released. If an integration test reports a missing RPC, column or
permission, check the website revision and pending migrations before changing
plugin code. Build and typecheck (`bun run build`, `bun run check`) do not need
a running database.

## MCP endpoint relocation

The relocation is committed and synchronized from website commit
[1c52a17](https://github.com/kerryhatcher/www.civpulse.org/commit/1c52a1764471f57be8d296f0838d772909b0ea9f).
The active endpoint is `https://api.civpulse.org/functions/v1/mcp`. Plugin 1.2.0
binds to **Civic Pulse MCP (Supabase)**, app
`asdk_app_6adb7102fd988191a89f556db8116075`. The old Cloudflare host redirects
to the new endpoint. OAuth's issuer remains on the original Supabase project domain.

This repository includes `supabase/functions/mcp`: the Deno entrypoint, pinned
imports and generated handler. This is MCP runtime source, separate from database
migrations/configuration/seeds/tests, which remain excluded. Run `bun run mcp:build`
after changing the shared source. Production deployment and the function's gateway
configuration (including `verify_jwt = false` for OAuth discovery, with user-token
verification inside the handler) remain managed by the website repository.

For future changes, synchronize the MCP implementation, function source, build/test
scripts, plugin manifests, app binding and endpoint documentation from the same
verified website revision. Record that commit in [source.json](source.json), retain
the explicit website dependency in the test runner, and run checks and integration
tests together. Do not import database migrations, config, seeds or database tests.
