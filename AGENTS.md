# Civic Pulse OpenAI plugin

Use Bun for installs, scripts and tooling (`bun`, `bun run`, `bunx`).
Read README.md and docs/mcp.md before changing the plugin or server.

- `plugins/civpulse` is the portable account plugin. Preserve its app binding,
  plugin identity and private audience. Keep both versioned manifests in sync.
- Build with `bun run plugin:build`; generated tool references come from the
  actual MCP server schemas. Keep the account package free of a second MCP server
  definition; direct-client configuration lives in `plugins/civpulse-mcp.json`.
- The MCP Worker forwards the caller's OAuth token. Never introduce a service-role
  key in runtime traffic. RLS and guarded RPCs enforce visibility and admin writes.
- Supabase migrations are append-only. This is a backend snapshot; coordinate
  schema changes with the website repository that owns production migrations.
- Document workflow changes in the same commit. Run `bun run check` and
  `bun run build` before completion. Run `bun run mcp:test` against a running
  local backend for auth/tool changes. Exercise the website consent/account flow
  as admin and regular user when changing browser-facing authorization behavior.
- Never commit credentials, local env files, dependencies or generated ZIPs.
- Production deployment remains managed by the website repository. A push here
  does not transfer hosting, apply migrations or publish a plugin release.
