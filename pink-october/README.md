# Starbucks × Pink October: motion piece

A 52.8 s vertical (1080×1920, 30 fps) motion graphic for a Pink October breast-cancer awareness event. The Starbucks Siren steps out of her circle in 3D, hugs the event photos with her tails, and every photo ends up forming one pink ribbon.

The whole video is code. Three.js builds the 3D, the GSAP timeline in this repo drives the animation, and Playwright + ffmpeg render it frame by frame. The music and sound effects are synthesised in Python. Each frame depends only on `t`, so a preview frame is identical to the final frame.

## Layout
- `src/main.js`: scene and timeline (logo, siren, cards, ribbon, text); `window.renderAt(t)`
- `src/timing.js`: beat-locked scene times (100 BPM), shared with the music
- `scripts/extract_siren.py`: vectorises the siren from the logo PNG into extrudable parts, with the tails split into hinged segments for the hug
- `scripts/render.mjs`: deterministic renderer (`--from --to --fps --scale --out | --sheet`)
- `scripts/music.py`: soundtrack and SFX synth, synced to `cache/timing.json`
- `scripts/build.sh`: full build (parallel render, music, loudness-normalised mux)
- `plan/storyboard.md`: shot list

## Rebuild
The event photos, videos, logo and renders are not in git (public repo). Put them back first:
```
assets/images/{group_a,group_b,group_c,trio,cake_board,cakepops_a,cake_hd_a,cake_hd_b}.jpg
assets/footage/{talk,banner,cake}.mp4      # portrait 576×1024 after rotation
assets/logo/starbucks_logo.png
```
Then:
```
npm install && pip install opencv-python-headless scipy numpy pillow
python3 scripts/extract_siren.py
for v in talk banner cake; do mkdir -p cache/frames/$v; ffmpeg -i assets/footage/$v.mp4 -vf fps=30,scale=576:1024 -q:v 3 cache/frames/$v/%05d.jpg; done
node scripts/render.mjs --from 0 --to 52.8 --fps 1 --scale 0.25 --cols 8 --sheet renders/previews/sheet_all.jpg   # quick check
bash scripts/build.sh v1
```
