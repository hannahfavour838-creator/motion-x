#!/usr/bin/env bash
# Runs the migrations + security tests against a throwaway local PostgreSQL.
# Requires PostgreSQL 15+ binaries (initdb, pg_ctl, psql) on PATH or PG_BIN.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PG_BIN="${PG_BIN:-$(dirname "$(command -v initdb 2>/dev/null || ls -d /usr/lib/postgresql/*/bin/initdb | tail -1)")}"
WORK="$(mktemp -d)"
PORT="${PG_TEST_PORT:-54329}"
RUN_AS=""
if [ "$(id -u)" = "0" ]; then RUN_AS="runuser -u ${PG_TEST_USER:-nobody} --"; chown -R "${PG_TEST_USER:-nobody}" "$WORK"; fi
cleanup() { $RUN_AS "$PG_BIN/pg_ctl" -D "$WORK/data" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT
$RUN_AS "$PG_BIN/initdb" -D "$WORK/data" -U postgres -A trust >/dev/null
$RUN_AS "$PG_BIN/pg_ctl" -D "$WORK/data" -o "-p $PORT -k $WORK -c listen_addresses=''" -l "$WORK/log" start -w >/dev/null
PSQL=("$PG_BIN/psql" -h "$WORK" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q -t -A)
"${PSQL[@]}" -f "$ROOT/supabase/tests/00_supabase_stubs.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do echo "→ migration $(basename "$f")"; "${PSQL[@]}" -f "$f"; done
echo "→ seed"; "${PSQL[@]}" -f "$ROOT/supabase/seed.sql" >/dev/null
if [ -n "${SEED_CHECK:-}" ]; then "${PSQL[@]}" -f "$SEED_CHECK"; fi
"${PSQL[@]}" -c "delete from public.vehicles where is_demo; delete from auth.users where email like '%@demo.motionx.invalid';"
"${PSQL[@]}" -f "$ROOT/supabase/tests/10_security.test.sql" 2>&1 | sed 's/^psql:[^ ]* NOTICE:  /  /' | grep -v '^$'
