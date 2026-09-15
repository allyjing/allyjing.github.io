#!/bin/zsh
# Runs every browser check, each against a FRESH headless Chrome.
#
# Needs `python3 serve.py` already running on port 8000.
#
# ⚠️ Two things here look like fussiness and are not. Both make an EMPTY run look
# like a clean one, which is the worst failure mode a check script can have:
#
#   ONE CHROME PER CHECK, SEQUENTIALLY. Two Node clients driving the same page
#   target at once crashed Chrome, and every suite after that printed
#   "0 pass, 0 fail" — indistinguishable from success.
#
#   EACH CHECK'S OUTPUT GOES TO A FILE, not straight down a pipe. Piping
#   `node ... 2>&1 | awk` in this script produced nothing at all while the same
#   command in a terminal printed thirteen passes; the backgrounded Chrome shares
#   the pipeline. Via a file it is reliable, and the line counts below prove the
#   check actually said something.
#
# Do not "simplify" either one back.
set -u

HERE=${0:a:h}
PORT=9331
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
CHECKS=(tables-layout gallery-lightbox time-freeze-and-panels lightbox-a11y walking-and-doors)

if [[ ! -x $CHROME ]]; then
  print "Chrome not found at: $CHROME"
  exit 1
fi
if ! curl -s -m 2 http://localhost:8000/ >/dev/null; then
  print "nothing serving on port 8000 — run: python3 serve.py"
  exit 1
fi

work=$(mktemp -d)
cleanup() { pkill -f "remote-debugging-port=$PORT" 2>/dev/null; rm -rf $work; }
trap cleanup EXIT INT TERM

fails=0
total=0

for f in $CHECKS; do
  pkill -f "remote-debugging-port=$PORT" 2>/dev/null
  sleep 1

  # A profile of its own, per check. A stale Chrome holding the playwright-mcp
  # profile lock is what blocks those tools — not Chrome itself.
  profile=$work/profile-$f
  mkdir -p $profile
  nohup $CHROME --headless=new --remote-debugging-port=$PORT --user-data-dir=$profile \
    --no-first-run --no-default-browser-check --disable-gpu --disable-dev-shm-usage \
    "http://localhost:8000/#/interior" >$work/chrome-$f.log 2>&1 &

  n=0
  until curl -s -m 2 http://127.0.0.1:$PORT/json/version >/dev/null 2>&1; do
    sleep 1
    n=$((n + 1))
    if (( n > 20 )); then
      print -- "$f: chrome failed to start (see $work/chrome-$f.log)"
      fails=$((fails + 1))
      continue 2
    fi
  done

  node $HERE/$f.mjs >$work/$f.out 2>$work/$f.err
  rc=$?
  pass=$(grep -c '^PASS' $work/$f.out)
  fail=$(grep -c '^FAIL' $work/$f.out)
  total=$((total + pass))

  grep '^FAIL' $work/$f.out | sed 's/^/  /'
  printf '%-26s %3d pass, %d fail\n' $f $pass $fail

  # A check that printed nothing did not run. Treat it as a failure, loudly —
  # silence here used to read as success.
  if (( pass + fail == 0 )); then
    print -- "  ^ NO ASSERTIONS RAN (node exit $rc). First error:"
    head -3 $work/$f.err | sed 's/^/    /'
    fails=$((fails + 1))
  elif (( fail > 0 )); then
    fails=$((fails + 1))
  fi
done

print ''
if (( fails == 0 )); then
  print -- "all clean — $total assertions across ${#CHECKS} suites"
else
  print -- "$fails of ${#CHECKS} suites have failures"
fi
exit $fails
