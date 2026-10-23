# Civic Pulse for OpenAI, ChatGPT and Codex

Source for the Civic Pulse private plugin and its authenticated remote MCP server.
Connects to [Civic Pulse MCP](https://api.civpulse.org/functions/v1/mcp) using each user's
Civic Pulse account and Supabase OAuth. Regular users can research permitted
civic records; administrators can edit content, manage maps, search accounts and
explicitly promote existing users.

## Contents

- [Portable plugin](plugins/civpulse/README.md): manifests (including hidden
  `.app.json` and `.codex-plugin/`), icon, four skills and generated tool references.
- [MCP server](apps/mcp/src/index.ts): shared HTTP handler, authentication and tool implementations.
- [Supabase function](supabase/functions/mcp/index.ts): Deno entrypoint, pinned imports
  and generated handler. This function source is included without database migrations
  or project configuration. The former Cloudflare Worker source is a compatibility redirect.
- [Connection configuration](plugins/civpulse-mcp.json) for direct MCP clients;
  [release metadata](plugins/civpulse-release.json) preserves the private plugin/app IDs.
- [MCP documentation](docs/mcp.md): OAuth setup, permissions, connection and tests.
- [CI quality checks](docs/ci.md): source/package validation and isolated OAuth/CRUD integration.
- `scripts/`: package validation/build, OAuth/CRUD integration tests.
- [Website backend dependency](docs/backend-dependency.md): database schema,
  migrations, configuration, seeds and database tests are owned by the website
  repository and are not duplicated here.
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

`check` typechecks the MCP server, verifies the generated function handler and runs
routing/origin tests. `build` bundles the Supabase function, validates the manifests and skills,
regenerates tool documentation/schemas from the server, and validates the archive
at `dist/plugins/civpulse-1.2.0.zip`. Generated archives and dependencies are ignored.
The package uses the existing registered ChatGPT app; do not put direct-client
`mcp.json` or `.mcp.json` files inside it. See the plugin README for installation,
account connection and release instructions. Building does not publish a release.

## Local backend and integration tests

The database is supplied by the [website repository](https://github.com/kerryhatcher/www.civpulse.org).
Follow [backend dependency setup](docs/backend-dependency.md) to start and migrate
its local Supabase stack, then run the plugin integration suite here:

```sh
CIVPULSE_WEBSITE_DIR=/absolute/path/to/www.civpulse.org bun run mcp:test
```

The suite reads local connection details using the website checkout's Supabase
configuration. It creates and cleans up local users/content, tests OAuth and role
enforcement, and rejects hosted backend URLs. Its service-role access is limited
to local test setup; the deployed MCP server never uses that key. Database
lifecycle, migrations and seeding commands must run from the website checkout.

`bun run mcp:dev` starts the shared handler in a Bun HTTP server on port 8789.
Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` from the website checkout's local
Supabase status, `AUTHORIZATION_SERVER` to that API URL plus `/auth/v1`, and
`MCP_RESOURCE_URL` to `http://localhost:8789/mcp` in your local environment.
The integration suite supplies these settings itself. This runner tests the shared
handler; production runs its generated bundle through the Supabase Deno entrypoint.

The consent/account website is hosted separately and is not included here. For
browser verification of authorization flows, run the website from the upstream
repository and ensure its consent URL matches Supabase's configured Site URL.

## Production ownership and maintenance

Synced from [website relocation commit 1c52a17](https://github.com/kerryhatcher/www.civpulse.org/commit/1c52a1764471f57be8d296f0838d772909b0ea9f).
The active endpoint is `https://api.civpulse.org/functions/v1/mcp`. Plugin 1.2.0
uses **Civic Pulse MCP (Supabase)**, app `asdk_app_6adb7102fd988191a89f556db8116075`.
The original Cloudflare host is retained as a compatibility redirect.

Production function deployment, Supabase configuration and database migrations
remain owned by the website repository. Pushing here does not deploy a function,
change the production database or publish/update the private ChatGPT plugin.
This repository's CI validates source, generated bundles and the plugin package;
it has no deployment workflow or `mcp:deploy` command.
See [backend dependency and synchronization](docs/backend-dependency.md).

Preserve plugin/app IDs, manifests and connection metadata when preparing a
release; bump both plugin manifests together. Account-specific IDs are not a
public-directory submission. Content edits made through MCP remain subject to the
website's separate static rebuild/deploy process.

Never commit OAuth tokens, passwords, service-role keys, `.env` or `.dev.vars`.
The endpoint URLs and plugin IDs are public configuration.
`bun run secret:scan` scans staged files with TruffleHog when installed; the
pre-commit hook is configured by `bun install`.
