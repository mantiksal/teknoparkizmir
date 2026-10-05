#!/usr/bin/env python3
"""İYTE Anamorfoz — çadır bilgisayarında çalışan yerel sunucu.

Statik dosyaları sunar ve stand tabletinden gelen ziyaretçileri (fotoğraf +
test sonucu) sıraya alır. Veriler yalnızca bu bilgisayarda, data/visitors/
altında tutulur ve çadır ekranındaki "Tüm verileri sil" ile silinir.

  python3 server.py [port]
"""
import base64
import json
import os
import re
import shutil
import socket
import sys
import threading
import time
import uuid
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, "data", "visitors")
MAX_BODY = 20 * 1024 * 1024
LOCK = threading.Lock()
ID_RE = re.compile(r"^[0-9a-f]{32}$")


def visitors():
    out = []
    if not os.path.isdir(DATA):
        return out
    for name in os.listdir(DATA):
        if name.endswith(".json"):
            try:
                with open(os.path.join(DATA, name), encoding="utf-8") as f:
                    out.append(json.load(f))
            except (OSError, ValueError):
                pass
    out.sort(key=lambda v: v.get("number", 0))
    return out


def save_meta(meta):
    path = os.path.join(DATA, meta["id"] + ".json")
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False)
    os.replace(tmp, path)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        if "/api/" in (self.path or "") and self.command != "GET":
            sys.stderr.write("%s %s\n" % (self.command, self.path))

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n <= 0 or n > MAX_BODY:
            raise ValueError("geçersiz boyut")
        return json.loads(self.rfile.read(n))

    def route(self):
        parts = self.path.split("?")[0].strip("/").split("/")
        return parts

    # ------------------------------------------------------------ GET
    def do_GET(self):
        p = self.route()
        if p[:1] == ["data"]:
            return self.send_error(403)
        if p[:2] == ["api", "visitors"]:
            if len(p) == 2:
                return self.json(visitors())
            if len(p) == 4 and p[3] == "photo" and ID_RE.match(p[2]):
                path = os.path.join(DATA, p[2] + ".jpg")
                if not os.path.exists(path):
                    return self.send_error(404)
                with open(path, "rb") as f:
                    data = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "image/jpeg")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
                return
            return self.send_error(404)
        if p == ["api", "ping"]:
            return self.json({"ok": True})
        return super().do_GET()

    # ------------------------------------------------------------ POST
    def do_POST(self):
        p = self.route()
        try:
            if p == ["api", "visitors"]:
                body = self.read_json()
                if not body.get("consent"):
                    return self.json({"error": "KVKK onayı gerekli"}, 400)
                m = re.match(r"^data:image/(jpeg|png);base64,(.+)$", body.get("photo", ""), re.S)
                if not m:
                    return self.json({"error": "fotoğraf eksik"}, 400)
                photo = base64.b64decode(m.group(2))
                with LOCK:
                    os.makedirs(DATA, exist_ok=True)
                    number = max([v.get("number", 0) for v in visitors()] + [0]) + 1
                    vid = uuid.uuid4().hex
                    with open(os.path.join(DATA, vid + ".jpg"), "wb") as f:
                        f.write(photo)
                    meta = {
                        "id": vid,
                        "number": number,
                        "name": str(body.get("name", ""))[:40].strip(),
                        "archetype": body.get("archetype"),
                        "scores": body.get("scores"),
                        "answers": body.get("answers"),
                        "createdAt": time.time(),
                        "status": "waiting",
                    }
                    save_meta(meta)
                return self.json(meta, 201)
            if len(p) == 4 and p[:2] == ["api", "visitors"] and p[3] == "status" and ID_RE.match(p[2]):
                body = self.read_json()
                with LOCK:
                    path = os.path.join(DATA, p[2] + ".json")
                    if not os.path.exists(path):
                        return self.send_error(404)
                    with open(path, encoding="utf-8") as f:
                        meta = json.load(f)
                    meta["status"] = str(body.get("status", "waiting"))
                    save_meta(meta)
                return self.json(meta)
        except (ValueError, OSError) as e:
            return self.json({"error": str(e)}, 400)
        return self.send_error(404)

    # ------------------------------------------------------------ DELETE
    def do_DELETE(self):
        p = self.route()
        if p == ["api", "visitors"]:
            with LOCK:
                shutil.rmtree(DATA, ignore_errors=True)
            return self.json({"deleted": True})
        if len(p) == 3 and p[:2] == ["api", "visitors"] and ID_RE.match(p[2]):
            with LOCK:
                for ext in (".json", ".jpg"):
                    try:
                        os.remove(os.path.join(DATA, p[2] + ext))
                    except FileNotFoundError:
                        pass
            return self.json({"deleted": True})
        return self.send_error(404)


def lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))  # paket gönderilmez, yalnızca arayüz seçilir
        return s.getsockname()[0]
    except OSError:
        return None
    finally:
        s.close()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    srv = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    ip = lan_ip()
    print()
    print("  Çadır ekranı :  http://localhost:%d/" % port)
    if ip:
        print("  Stand tableti:  http://%s:%d/stand.html   (aynı Wi-Fi)" % (ip, port))
    print()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
