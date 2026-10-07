#!/bin/sh
# Stand ekranlarını yerelde sunar:
#   2. monitör (deneyim): http://localhost:8001/display-deneyim/
#   1. monitör (Muhafız):  http://localhost:8001/display-muhafiz/
#   Telefon testi:         http://localhost:8001/quiz-girisimci/
cd "$(dirname "$0")"
PORT=${PORT:-8001}
URL="http://localhost:$PORT/display-deneyim/"

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $PORT zaten kullanımda — sunucu muhtemelen başka bir terminalde açık."
  echo "Tarayıcıda açılıyor: $URL"
  echo "Yeniden başlatmak isterseniz önce durdurun:  kill \$(lsof -t -iTCP:$PORT -sTCP:LISTEN)"
  open "$URL" 2>/dev/null
  exit 0
fi

echo "Stand ekranı: $URL   (durdurmak için Ctrl+C)"
( sleep 1; open "$URL" 2>/dev/null ) &
exec python3 server.py "$PORT"
