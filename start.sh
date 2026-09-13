#!/bin/bash
PORT=8000
PID=$(lsof -ti :$PORT)
if [ -n "$PID" ]; then
  echo "Port $PORT is already in use (PID: $PID). Restarting server..."
  kill -9 $PID 2>/dev/null
  sleep 0.5
fi

echo "Starting Image Compressor server at http://localhost:$PORT"
sleep 1 && open "http://localhost:$PORT" &
python3 -m http.server $PORT

