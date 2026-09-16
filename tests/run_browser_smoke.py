#!/usr/bin/env python3
"""Serve Sundae Run and receive the result from tests/browser-smoke.html."""

from __future__ import annotations

import json
import socket
import sys
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


REPO = Path(__file__).resolve().parents[1]
ROOT = REPO.parent
HOST = "127.0.0.1"
PORT = 4185
RESULT: dict | None = None
OFFLINE = False


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self) -> None:
        if OFFLINE:
            # Close the connection so the service worker receives the same
            # rejected fetch it would see with airplane mode enabled.
            self.close_connection = True
            try:
                self.connection.shutdown(socket.SHUT_RDWR)
            except OSError:
                pass
            self.connection.close()
            return
        super().do_GET()

    def do_POST(self) -> None:
        global OFFLINE, RESULT
        path = urlparse(self.path).path
        if path == "/__go_offline":
            OFFLINE = True
            self.send_response(204)
            self.end_headers()
            return
        if path != "/__browser_test_result":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length", "0"))
        try:
            RESULT = json.loads(self.rfile.read(length))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_error(400)
            return
        self.send_response(204)
        self.end_headers()

    def log_message(self, format: str, *args: object) -> None:
        if urlparse(self.path).path == "/__browser_test_result":
            return
        super().log_message(format, *args)


def main() -> int:
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    server.timeout = 0.5
    url = f"http://{HOST}:{PORT}/sundae-run-web/tests/browser-smoke.html"
    print(url, flush=True)
    deadline = time.monotonic() + 45
    while RESULT is None and time.monotonic() < deadline:
        server.handle_request()
    server.server_close()
    if RESULT is None:
        print("Browser smoke test timed out without a result.", file=sys.stderr)
        return 1
    for result in RESULT.get("results", []):
        state = "PASS" if result.get("passed") else "FAIL"
        detail = f" — {result.get('detail')}" if result.get("detail") else ""
        print(f"{state}: {result.get('name')}{detail}")
    if not RESULT.get("passed"):
        print("Browser smoke test failed.", file=sys.stderr)
        return 1
    print("Sundae Run browser smoke passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
