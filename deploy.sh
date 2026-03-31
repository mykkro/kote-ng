#!/usr/bin/env bash
# deploy.sh — Build and deploy kote-ng to XAMPP
#
# Usage: bash deploy.sh
#
# Copies the app to c:/xampp/htdocs/kote-ng/
# Preserves the api/data/ directory (SQLite database) on the target.

set -euo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="/c/xampp/htdocs/kote-ng"

echo "==> Source:      $SRC"
echo "==> Destination: $DEST"

# ---------------------------------------------------------------------------
# 1. Build JS bundle
# ---------------------------------------------------------------------------
echo ""
echo "==> Building JS bundle..."
node "$SRC/build.mjs"

# ---------------------------------------------------------------------------
# 2. Copy files to XAMPP, skipping directories that should not be deployed.
#    api/data/ is excluded to preserve the live SQLite database.
# ---------------------------------------------------------------------------
echo ""
echo "==> Deploying to $DEST ..."

EXCLUDES=( ".git" "node_modules" ".claude" )

# Copy top-level files
for f in "$SRC"/*; do
    name="$(basename "$f")"
    skip=false
    for ex in "${EXCLUDES[@]}"; do
        [ "$name" = "$ex" ] && skip=true && break
    done
    $skip && continue

    if [ -f "$f" ]; then
        cp -f "$f" "$DEST/$name"
        echo "  file: $name"
    elif [ -d "$f" ]; then
        if [ "$name" = "api" ]; then
            # Copy api/ but skip api/data/ (preserve live database)
            mkdir -p "$DEST/api"
            for ff in "$f"/*; do
                sub="$(basename "$ff")"
                [ "$sub" = "data" ] && continue
                cp -rf "$ff" "$DEST/api/$sub"
                echo "  api/$sub"
            done
        else
            cp -rf "$f" "$DEST/"
            echo "  dir:  $name/"
        fi
    fi
done

# ---------------------------------------------------------------------------
# 3. Ensure api/data/ exists for the SQLite database
# ---------------------------------------------------------------------------
echo ""
echo "==> Ensuring api/data/ directory exists..."
mkdir -p "$DEST/api/data"

echo ""
echo "==> Deploy complete!"
echo "    Open http://localhost/kote-ng/ in your browser."
