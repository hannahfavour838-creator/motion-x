// Mirrors scripts/db-test.sh on PGlite (real PostgreSQL compiled to WASM, currently 18.x):
// stubs → every migration in order → seed → delete demo data → security tests.
// TWICE=1 re-applies the hardening migration to check it is idempotent; VERBOSE=1 lists every assertion.
// Usage: npm run db:test:pglite   (no PostgreSQL install needed; PGlite = PostgreSQL compiled to WASM)
// Supabase-specific objects are stubbed by supabase/tests/00_supabase_stubs.sql. This is a close
// stand-in, not Supabase itself — run supabase/tests on a real Postgres (npm run db:test) when available.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const root = process.argv[2] ?? join(import.meta.dirname, "..", "..");
let ok = 0;
const db = await PGlite.create();

async function run(label, sql) {
  try {
    await db.exec(sql);
  } catch (e) {
    console.error(`\n✗ FAILED in ${label}: ${e.message}`);
    if (e.where) console.error(`  where: ${e.where}`);
    process.exit(1);
  }
}

// Capture NOTICE output ("ok  …" lines from test.ok / test.fails)
const origExec = db.exec.bind(db);
db.exec = (sql) => origExec(sql, { onNotice: (n) => { if (n.message?.startsWith("ok ")) { ok++; if (process.env.VERBOSE) console.log("  " + n.message); } } });

await run("00_supabase_stubs.sql", readFileSync(join(root, "supabase/tests/00_supabase_stubs.sql"), "utf8"));
const migrations = readdirSync(join(root, "supabase/migrations")).filter((f) => f.endsWith(".sql")).sort()
for (const f of migrations) {
  console.log(`→ migration ${f}`);
  let sql = readFileSync(join(root, "supabase/migrations", f), "utf8");
  // PGlite build has no loadable pgcrypto; the schema only uses core gen_random_uuid().
  if (sql.includes("create extension if not exists pgcrypto;")) { sql = sql.replace("create extension if not exists pgcrypto;", ""); console.log("  (harness: skipped 'create extension pgcrypto' — not used beyond core gen_random_uuid)"); }
  await run(f, sql);
  if (process.env.TWICE && f.includes("000300")) { console.log("  (re-applying " + f + ")"); await run(f + " (second time)", sql); }
}
console.log("→ seed");
await run("seed.sql", readFileSync(join(root, "supabase/seed.sql"), "utf8"));
await run("demo cleanup", "delete from public.vehicles where is_demo; delete from auth.users where email like '%@demo.motionx.invalid';");

// Test file: handle the psql meta-commands it uses (\set, \gset, \echo).
let test = readFileSync(join(root, "supabase/tests/10_security.test.sql"), "utf8").replace(/^\\set ON_ERROR_STOP on\s*$/m, "");
const echoes = [...test.matchAll(/^\\echo '(.*)'\s*$/gm)].map((m) => m[1]);
test = test.replace(/^\\echo .*$/gm, "");
const parts = test.split(/^(.*)\\gset\s*$/m); // [before, query, after, ...]
let vars = {};
const subst = (sql) => sql.replace(/:'(\w+)'/g, (m, v) => (v in vars ? `'${String(vars[v]).replace(/'/g, "''")}'` : m));
for (let i = 0; i < parts.length; i += 2) {
  await run("10_security.test.sql", subst(parts[i]));
  if (parts[i + 1]) {
    const r = await db.query(subst(parts[i + 1]));
    vars = { ...vars, ...r.rows[0] };
  }
}
console.log(`\n${ok} assertions passed`);
for (const e of echoes) console.log(e);
