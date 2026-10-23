// Check invariants that can otherwise drift across the plugin, Bun and Deno runtimes.
import assert from 'node:assert/strict';
import { resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');
const read = path => Bun.file(resolve(root, path)).json();
const [source, mcp, deno, manifest, compatibility, app, release, connection] = await Promise.all([
  read('docs/source.json'), read('apps/mcp/package.json'), read('supabase/functions/mcp/deno.json'),
  read('plugins/civpulse/plugin.json'), read('plugins/civpulse/.codex-plugin/plugin.json'),
  read('plugins/civpulse/.app.json'), read('plugins/civpulse-release.json'), read('plugins/civpulse-mcp.json'),
]);
assert.equal(source.repository, 'https://github.com/kerryhatcher/www.civpulse.org');
assert.match(source.commit, /^[a-f0-9]{40}$/, 'Pin the website backend to a full commit SHA');
for (const name of ['@modelcontextprotocol/server', '@supabase/supabase-js', 'zod']) {
  const version = mcp.dependencies[name];
  assert.match(version, /^\d+\.\d+\.\d+$/, `Pin ${name} to an exact runtime version`);
  assert.equal(deno.imports[name], `npm:${name}@${version}`, `${name} differs between Bun and Deno`);
}
assert.equal(manifest.version, compatibility.version);
assert.equal(manifest.version, release.version, 'Update release metadata with the plugin version');
assert.equal(app.apps.civpulse.id, release.registered_app_id);
assert.equal(release.connection_plugin_id, `plugin_${release.registered_app_id}`);
assert.equal(connection.mcpServers.civpulse.url, release.mcp_endpoint);
const entrypoint = await Bun.file(resolve(root, 'supabase/functions/mcp/index.ts')).text();
assert.ok(entrypoint.includes(`MCP_RESOURCE_URL: '${release.mcp_endpoint}'`), 'Deno entrypoint endpoint differs from plugin');
const tracked = Bun.spawnSync(['git', 'ls-files', '-z', '--', 'supabase'], { cwd: root });
assert.equal(tracked.exitCode, 0);
for (const path of tracked.stdout.toString().split('\0').filter(Boolean)) {
  assert.ok(path.startsWith('supabase/functions/mcp/'), `Database files belong in the website repository: ${path}`);
}
console.log('Verified pinned website dependency, Bun/Deno runtime parity, plugin release binding and backend boundary.');
