#!/usr/bin/env bash
# Boots a clean production server + headless Chrome, runs the QA harness, cleans up.
# Usage: bash _qa/qa.sh [extra args passed to run.mjs]
set -uo pipefail
cd "$(dirname "$0")/.."

PORT=3103
CDP=9222
SCR="${SCRATCH:-/tmp}"

cleanup() {
  [ -n "${SERVER_PID:-}" ] && kill "$SERVER_PID" 2>/dev/null
  [ -n "${CHROME_PID:-}" ] && kill "$CHROME_PID" 2>/dev/null
  pkill -f "remote-debugging-port=$CDP" 2>/dev/null
  wait 2>/dev/null
}
trap cleanup EXIT

echo "── killing stale processes ──"
pkill -f "next-server" 2>/dev/null
pkill -f "next start" 2>/dev/null
pkill -f "next dev" 2>/dev/null
pkill -f "remote-debugging-port=$CDP" 2>/dev/null
sleep 2

if [ ! -f ".next/BUILD_ID" ]; then
  echo "── no production build, building ──"
  npx next build 2>&1 | grep -E "✓|error|Error" | head -5
fi

echo "── starting server on :$PORT ──"
npx next start -p "$PORT" > "$SCR/qa-server.log" 2>&1 &
SERVER_PID=$!
for i in $(seq 1 60); do
  if node -e "fetch('http://localhost:$PORT/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
    echo "   server ready"; break
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then echo "   SERVER DIED:"; tail -5 "$SCR/qa-server.log"; exit 1; fi
  sleep 1
done

echo "── starting headless Chrome ──"
rm -rf "$SCR/qa-chrome"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-first-run --no-default-browser-check \
  --window-size=1600,1100 --remote-debugging-port=$CDP \
  --user-data-dir="$SCR/qa-chrome" about:blank > "$SCR/qa-chrome.log" 2>&1 &
CHROME_PID=$!
for i in $(seq 1 30); do
  node -e "fetch('http://localhost:$CDP/json/version').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null && { echo "   chrome ready"; break; }
  sleep 1
done

echo "── running harness ──"
node _qa/run.mjs --base="http://localhost:$PORT" "$@"
