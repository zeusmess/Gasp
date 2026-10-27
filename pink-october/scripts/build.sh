#!/usr/bin/env bash
# Full build: frames (3 parallel chunks) → soundtrack → mux + loudness → renders/final/<name>_v<N>.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
VER=${1:-v1}
OUT=renders/final/starbucks_pink_october_${VER}.mp4
mkdir -p cache/chunks renders/final assets/music

if [ "${SKIP_FRAMES:-0}" != "1" ]; then
  node scripts/render.mjs --from 0    --to 17.6 --fps 30 --scale 1 --out cache/chunks/c1.mp4 &
  node scripts/render.mjs --from 17.6 --to 35.2 --fps 30 --scale 1 --out cache/chunks/c2.mp4 &
  node scripts/render.mjs --from 35.2 --to 52.8 --fps 30 --scale 1 --out cache/chunks/c3.mp4 &
  wait
fi

python3 scripts/music.py assets/music/soundtrack_raw.wav
printf "file '%s'\n" c1.mp4 c2.mp4 c3.mp4 > cache/chunks/list.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i cache/chunks/list.txt -c copy cache/video_only.mp4

# two-pass loudnorm to -14 LUFS / -1.5 dBTP
STATS=$(ffmpeg -hide_banner -i assets/music/soundtrack_raw.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
val() { echo "$STATS" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -y -loglevel error -i assets/music/soundtrack_raw.wav \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(val input_i):measured_TP=$(val input_tp):measured_LRA=$(val input_lra):measured_thresh=$(val input_thresh):offset=$(val target_offset):linear=true,aresample=48000" \
  -c:a pcm_s16le assets/music/soundtrack.wav

ffmpeg -y -loglevel error -i cache/video_only.mp4 -i assets/music/soundtrack.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$OUT"
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate,sample_rate -of compact "$OUT"
echo "→ $OUT"
