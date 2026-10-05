#!/bin/sh
# Çadır bilgisayarında çalıştırın. Tablet aynı Wi-Fi'den stand sayfasına bağlanır.
cd "$(dirname "$0")"
PORT=${PORT:-8000}
( sleep 1; open "http://localhost:$PORT" 2>/dev/null ) &
exec python3 server.py "$PORT"
