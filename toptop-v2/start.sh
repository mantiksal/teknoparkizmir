#!/bin/sh
# Stand ekranını (2. monitör) başlatır: http://localhost:8001/display/
# Telefon testi GitHub Pages'te yayında; yerelde de http://localhost:8001/quiz/ adresinden denenebilir.
cd "$(dirname "$0")"
PORT=${PORT:-8001}
( sleep 1; open "http://localhost:$PORT/display/" 2>/dev/null ) &
exec python3 -m http.server "$PORT" --bind 127.0.0.1
