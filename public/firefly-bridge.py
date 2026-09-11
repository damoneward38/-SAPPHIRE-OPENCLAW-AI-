#!/usr/bin/env python3
"""
====================================================================
FIREFLY LOCAL COMPUTER BRIDGE (Python 3)
Full Autonomy & Remote Execution Daemon for Damone's Computer
====================================================================
Zero pip dependencies required - uses native Python standard library.

HOW TO RUN:
  python3 firefly-bridge.py
  python3 firefly-bridge.py --autonomous
  python3 firefly-bridge.py --port 8765
====================================================================
"""

import sys
import os
import json
import time
import socket
import platform
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

PORT = 8765
MODE = "say_okay_gate"  # "say_okay_gate" | "full_autonomous"

# Parse CLI args
for i, arg in enumerate(sys.argv):
    if arg == "--port" and i + 1 < len(sys.argv):
        try:
            PORT = int(sys.argv[i + 1])
        except ValueError:
            pass
    if arg == "--autonomous":
        MODE = "full_autonomous"

pending_action = None

def get_telemetry():
    return {
        "platform": sys.platform,
        "arch": platform.machine(),
        "release": platform.release(),
        "hostname": socket.gethostname(),
        "username": os.getlogin() if hasattr(os, "getlogin") else os.environ.get("USER", "unknown"),
        "homeDir": os.path.expanduser("~"),
        "cpuCount": os.cpu_count() or 1,
        "pythonVersion": platform.python_version()
    }

class FireflyHandler(BaseHTTPRequestHandler):
    def _set_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-firefly-token")

    def do_OPTIONS(self):
        self.send_response(204)
        self._set_cors()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path in ["/health", "/status", "/"]:
            global pending_action
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._set_cors()
            self.end_headers()
            resp = {
                "status": "online",
                "agent": "Firefly Local Computer Bridge (Python)",
                "version": "1.0.0",
                "mode": MODE,
                "hasPendingAction": bool(pending_action),
                "pendingCommand": pending_action.get("command") if pending_action else None,
                "telemetry": get_telemetry()
            }
            self.wfile.write(json.dumps(resp).encode("utf-8"))
        else:
            self.send_response(404)
            self._set_cors()
            self.end_headers()

    def do_POST(self):
        global pending_action, MODE
        parsed = urlparse(self.path)
        content_length = int(self.headers.get("Content-Length", 0))
        body_bytes = self.rfile.read(content_length) if content_length > 0 else b"{}"
        try:
            data = json.loads(body_bytes.decode("utf-8"))
        except Exception:
            data = {}

        if parsed.path == "/auth/say-okay":
            if pending_action:
                pending_action["confirmed"] = True
                print("\n\033[92m✔ Voice / Browser Handshake Received 'OKAY' - Executing!\033[0m")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self._set_cors()
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "message": "Command approved"}).encode("utf-8"))
            else:
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self._set_cors()
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "message": "No pending command"}).encode("utf-8"))
            return

        if parsed.path == "/mode":
            new_mode = data.get("mode")
            if new_mode in ["full_autonomous", "say_okay_gate"]:
                MODE = new_mode
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self._set_cors()
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "mode": MODE}).encode("utf-8"))
            return

        if parsed.path == "/exec":
            command = data.get("command", "").strip()
            cwd = data.get("cwd") or os.path.expanduser("~")
            bypass = bool(data.get("bypassOkay") or MODE == "full_autonomous")

            if not command:
                self.send_response(400)
                self._set_cors()
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Command required"}).encode("utf-8"))
                return

            if not bypass:
                print(f"\n\033[96m⚡ FIREFLY REQUEST: '{command}'\033[0m")
                print("\033[95mAwaiting 'Say Okay' in browser voice...\033[0m")
                pending_action = {"command": command, "confirmed": False}
                start_wait = time.time()
                while not pending_action.get("confirmed"):
                    time.sleep(0.3)
                    if time.time() - start_wait > 90:
                        pending_action = None
                        self.send_response(403)
                        self._set_cors()
                        self.end_headers()
                        self.wfile.write(json.dumps({"error": "Timed out waiting for 'Say Okay'"}).encode("utf-8"))
                        return
                pending_action = None

            # Execute
            start_t = time.time()
            try:
                proc = subprocess.run(
                    command,
                    shell=True,
                    cwd=cwd,
                    capture_output=True,
                    text=True,
                    timeout=120
                )
                dur = int((time.time() - start_t) * 1000)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self._set_cors()
                self.end_headers()
                resp = {
                    "success": proc.returncode == 0,
                    "command": command,
                    "exitCode": proc.returncode,
                    "stdout": proc.stdout,
                    "stderr": proc.stderr,
                    "durationMs": dur
                }
                self.wfile.write(json.dumps(resp).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self._set_cors()
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
            return

        if parsed.path == "/open":
            target = data.get("target", "")
            if not target:
                self.send_response(400)
                self._set_cors()
                self.end_headers()
                return

            if sys.platform == "darwin":
                cmd = f'open "{target}"'
            elif sys.platform == "win32":
                cmd = f'start "" "{target}"'
            else:
                cmd = f'xdg-open "{target}"'

            subprocess.run(cmd, shell=True)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._set_cors()
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "opened": target}).encode("utf-8"))
            return

        self.send_response(404)
        self._set_cors()
        self.end_headers()

    def log_message(self, format, *args):
        # Silence default HTTP server access logs
        return

if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", PORT), FireflyHandler)
    print(f"\033[92m⚡ Firefly Local Computer Bridge (Python) running on http://127.0.0.1:{PORT}\033[0m")
    print(f"Mode: {MODE.upper()} - Ready for browser voice control.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Firefly Bridge.")
