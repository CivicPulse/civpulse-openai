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

The website repository is also where the Cloudflare-to-Supabase Functions
relocation is being developed. At this cleanup, that work is in progress in a
separate website worktree and has not been committed to its remote `main`.
The MCP source and connection configuration here still reflect the imported
revision recorded in [source.json](source.json).

When the relocation is committed, synchronize its MCP implementation, build/test
scripts, plugin manifests, registered-app binding and endpoint documentation from
the same verified website revision. Record the source commit and run checks and
integration tests together. Do not import `supabase/migrations`, database config,
seeds or database tests again; any function source needed by the MCP build is a
separate concern. Use the website repository's current MCP documentation for
production deployment and the active endpoint during the transition.
