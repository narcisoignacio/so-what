#!/usr/bin/env bash
# M0 spike: build a tiny database from schema.sql + seed_m0.sql for `turso db import`.
# Replaced by build.py in M2. Steps follow spec §5.6 "write": fresh file, VACUUM, then WAL.
set -euo pipefail
cd "$(dirname "$0")/.."

out=data/sowhat-m0.db
mkdir -p data
rm -f "$out" "$out-wal" "$out-shm"
sqlite3 "$out" < pipeline/schema.sql
sqlite3 "$out" < pipeline/seed_m0.sql
sqlite3 "$out" 'VACUUM; PRAGMA journal_mode=WAL;' > /dev/null
echo "built $out"