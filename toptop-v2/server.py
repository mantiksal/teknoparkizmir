#!/usr/bin/env python3
"""Stand ekranı için yerel sunucu (yalnızca bu bilgisayar).

Python'un basit sunucusundan farkı: video için Range isteklerini destekler;
böylece tanıtım videosu istenen saniyeden başlatılabilir ve döngüde akıcı oynar.

  python3 server.py [port]
"""
import os
import re
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
# Repo kökündeki 1. monitör ekranı da aynı sunucudan: /qr-display/
EXTRA = {"/qr-display/": os.path.join(os.path.dirname(ROOT), "qr-display")}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        pass

    def translate_path(self, path):
        clean = path.split("?", 1)[0].split("#", 1)[0]
        if clean == "/qr-display":
            clean = "/qr-display/"
        for prefix, base in EXTRA.items():
            if clean.startswith(prefix):
                rel = clean[len(prefix):]
                parts = [p for p in rel.split("/") if p and p not in (".", "..")]
                from urllib.parse import unquote
                return os.path.join(base, *[unquote(p) for p in parts])
        return super().translate_path(path)

    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def do_GET(self):
        rng = self.headers.get("Range")
        path = self.translate_path(self.path)
        if not rng or not os.path.isfile(path):
            return super().do_GET()
        m = re.match(r"bytes=(\d*)-(\d*)$", rng.strip())
        size = os.path.getsize(path)
        if not m:
            return super().do_GET()
        start = int(m.group(1)) if m.group(1) else max(0, size - int(m.group(2) or 0))
        end = int(m.group(2)) if m.group(1) and m.group(2) else size - 1
        end = min(end, size - 1)
        if start > end:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()
        try:
            with open(path, "rb") as f:
                f.seek(start)
                left = end - start + 1
                while left > 0:
                    chunk = f.read(min(1 << 20, left))
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    left -= len(chunk)
        except (BrokenPipeError, ConnectionResetError):
            pass


class Server(ThreadingHTTPServer):
    # Varsayılan bekleme kuyruğu (5) sayfa açılırken onlarca eşzamanlı istekte taşıyor
    # ve tarayıcı "bağlantı sıfırlandı" hatası alıyor.
    request_queue_size = 128
    daemon_threads = True


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8001
    Server(("127.0.0.1", port), Handler).serve_forever()
