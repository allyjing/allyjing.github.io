#!/usr/bin/env python3
"""Development server.

Identical to `python3 -m http.server` except that it tells the browser not to cache
anything. Without that, Chrome happily serves a stale copy of an ES module after you
have edited it, and you end up debugging code that is not running. That failure is
silent and very confusing, which is why this file exists.

    python3 serve.py            # http://localhost:8000

Nothing here ships. GitHub Pages serves the files directly.
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, fmt, *args):
        if '404' in (fmt % args):        # keep the missing-file lines, drop the rest
            super().log_message(fmt, *args)

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f'serving on http://localhost:{port}  (no-cache)')
    ThreadingHTTPServer(('127.0.0.1', port), NoCacheHandler).serve_forever()
