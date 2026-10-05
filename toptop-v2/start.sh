#!/bin/sh
# Stand ekranını (2. monitör) başlatır: http://localhost:8001/display/
# Telefon testi GitHub Pages'te yayında; yerelde de http://localhost:8001/quiz/ adresinden denenebilir.
cd "$(dirname "$0")"
PORT=${PORT:-8001}
URL="http://localhost:$PORT/display/"

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $PORT zaten kullanımda — sunucu muhtemelen başka bir terminalde açık."
  echo "Tarayıcıda açılıyor: $URL"
  echo "Yeniden başlatmak isterseniz önce durdurun:  kill \$(lsof -t -iTCP:$PORT -sTCP:LISTEN)"
  open "$URL" 2>/dev/null
  exit 0
fi

echo "Stand ekranı: $URL   (durdurmak için Ctrl+C)"
( sleep 1; open "$URL" 2>/dev/null ) &
exec python3 -m http.server "$PORT" --bind 127.0.0.1
