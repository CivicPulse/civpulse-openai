# Civic Pulse for OpenAI, ChatGPT and Codex

Source for the Civic Pulse private plugin and its authenticated remote MCP server.
Connects to [Civic Pulse MCP](https://mcp.civpulse.org/mcp) using each user's
Civic Pulse account and Supabase OAuth. Regular users can research permitted
civic records; administrators can edit content, manage maps, search accounts and
explicitly promote existing users.

## Contents

- [Portable plugin](plugins/civpulse/README.md): manifests (including hidden
  `.app.json` and `.codex-plugin/`), icon, four skills and generated tool references.
- [MCP server](apps/mcp/src/index.ts): Cloudflare Worker, authentication and tool implementations.
- [Connection configuration](plugins/civpulse-mcp.json) for direct MCP clients;
  [release metadata](plugins/civpulse-release.json) preserves the private plugin/app IDs.
- [MCP documentation](docs/mcp.md): OAuth setup, permissions, connection and tests.
- `scripts/`: package validation/build, OAuth/CRUD integration tests and local user seeding.
- `supabase/`: complete backend migration/config/seed snapshot required by the
  server's RPCs, RLS policies and local integration tests. Migrations retain their
  original names and contents; this is not a second production migration pipeline.
- [Upstream reference documentation](docs/upstream/architecture.md), including
  [backend](docs/upstream/backend.md), [development](docs/upstream/development.md)
  and [maps](docs/upstream/maps.md). These snapshots describe the full website;
  their relative links point back to the pinned upstream source.
- [Source inventory and commit](docs/source.json) records extraction provenance.

## Install, check and package

Requires Bun and the `zip`/`unzip` command-line tools:

```sh
bun install --frozen-lockfile
bun run check
bun run build
```

`check` typechecks the MCP Worker. `build` validates the manifests and skills,
regenerates tool documentation/schemas from the server, and validates the archive
at `dist/plugins/civpulse-1.1.0.zip`. Generated archives and dependencies are ignored.
The package uses the existing registered ChatGPT app; do not put direct-client
`mcp.json` or `.mcp.json` files inside it. See the plugin README for installation,
account connection and release instructions. Building does not publish a release.

## Local backend and integration tests

Requires a running Docker-compatible engine for the Supabase CLI:

```sh
bun run db:start
bun run db:seed-user
bun run mcp:test
```

The copied Supabase configuration retains project ID `civpulse` and ports
54321–54329. It can therefore reuse the website checkout's existing local stack;
check `bun run db:status` first. Do not start a competing stack or reset a shared
backend inadvertently. `bun run db:migrate` applies pending migrations while
keeping data; `bun run db:reset` erases and reseeds the local database.
The integration suite creates and cleans up local users/content, tests OAuth and
role enforcement, and rejects hosted backend URLs. Its service-role access is
limited to local test setup; the deployed MCP server never uses that key.

`bun run mcp:dev` starts the Worker using its Wrangler configuration. The checked-in
configuration contains public production URLs and a publishable key. For local
interactive development, override its vars in an ignored `apps/mcp/.dev.vars` file
with the local Supabase URL/anon key and matching authorization/resource URLs.
The integration suite generates this local configuration itself.

The consent/account website is hosted separately and is not included here. For
browser verification of authorization flows, run the website from the upstream
repository and ensure its consent URL matches Supabase's configured Site URL.

## Production ownership and maintenance

Extracted from [www.civpulse.org](https://github.com/kerryhatcher/www.civpulse.org)
at commit `99f4adab5f597911457493862b5c872b2a5fd516`.
The original source and existing Cloudflare Workers Builds/Supabase pipelines
remain in that repository. Pushing here does not deploy the Worker, change the
production database or publish/update the private ChatGPT plugin. Coordinate
server/schema changes upstream and follow its migration-gated deployment process.
There is deliberately no automatic deployment workflow in this repository.

Preserve plugin/app IDs, manifests and connection metadata when preparing a
release; bump both plugin manifests together. Account-specific IDs are not a
public-directory submission. Content edits made through MCP remain subject to the
website's separate static rebuild/deploy process.

Never commit OAuth tokens, passwords, service-role keys, `.env` or `.dev.vars`.
The copied Worker URL/publishable key and plugin IDs are public configuration.
`bun run secret:scan` scans staged files with TruffleHog when installed; the
pre-commit hook is configured by `bun install`.
