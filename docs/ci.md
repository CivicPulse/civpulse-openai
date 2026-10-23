# GitHub Actions quality checks

[The MCP quality workflow](../.github/workflows/mcp.yml) runs on pushes to `main`,
pull requests and manual dispatches. It validates this repository without deploying
functions, changing production data or publishing the plugin.

## Source and package checks

The fast job installs the committed lockfile with Bun 1.4.3 and runs `bun run check`
and `bun run build`. Checks cover:

- The website dependency is a full commit SHA in `docs/source.json`.
- Bun and Deno use the same exact runtime dependency versions.
- Release metadata agrees with both plugin manifests, the registered app binding
  and the Supabase function's endpoint.
- Database files have not been committed under `supabase/`; only MCP function
  source belongs there.
- TypeScript, gateway routing, OAuth discovery and origin restrictions pass.
- The function bundle, skill metadata, tool schemas and plugin ZIP are valid.

After building, CI rejects changes to the committed lockfile, function bundle or
generated tool references. Regenerate locally and commit the resulting files when
changing their source. A successful build alone must not hide a stale catalog.

## Local OAuth and CRUD integration

A separate job checks out the public website repository at the exact revision
recorded in `docs/source.json`, under the ignored `.ci/website/` directory. It
starts a disposable local Supabase stack using that checkout's migrations and
configuration, then runs this repository's `bun run mcp:test` with
`CIVPULSE_WEBSITE_DIR` pointing to the website checkout. No hosted credentials or
additional repository secrets are needed. Migrations are fetched as a test
dependency; they remain excluded from this repository's source.

The suite verifies OAuth registration/PKCE, refresh/revocation, invalid-token
rejection, reader/admin visibility, content and link CRUD, rollback, account
search/promotion, profiles and image operations. It uses the shared MCP handler
through the local Bun runner. It does not run the Deno gateway or a browser
consent flow; source/routing checks and manual release verification complement it.

Unused Supabase services are excluded to reduce startup cost. Startup stdout is
kept in a runner-local file to avoid printing local service keys. Failures show
container names/status, and an `always()` step stops the disposable stack and
removes its data. Job and step timeouts bound stalled startup/tests. New runs
cancel older runs for the same ref. Jobs use read-only repository permissions,
SHA-pinned actions, an explicit Ubuntu runner version and checkouts without
persisted Git credentials.

To reproduce the integration suite locally, follow
[backend dependency setup](backend-dependency.md). Do not run the CI cleanup
command against a shared developer stack: `stop --no-backup` removes its data.

## Updating the workflow

Validate changes with `actionlint .github/workflows/mcp.yml`, `bun run check` and
`bun run build`. Run the OAuth/CRUD suite for integration-runner changes. After
pushing, inspect both jobs for the new commit; a local test run does not verify
GitHub runner provisioning or Docker startup.
