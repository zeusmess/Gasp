# PROGRESS: Starbucks Pink October   (updated 2026-10-27)
Phase: DONE (v1 delivered, awaiting feedback)
Current version: v1 → renders/final/starbucks_pink_october_v1.mp4 (not in git)
Done:
- Assets ingested (8 photos, 3 portrait videos, logo); siren vectorised into 7 hinged parts
- 3D scene + GSAP timeline for all 8 scenes; contact sheets checked over the full 52.8 s
- Soundtrack synthesised (100 BPM, A major, vi–IV–I–V), SFX synced to scene times
- v1 rendered: 1080×1920, 30 fps, 52.8 s, H.264 + AAC 48 kHz, −13.9 LUFS, peak −1.1 dB
  master renders/final/starbucks_pink_october_v1.mp4 (126 MB), share copy …_v1_share.mp4 (38 MB, CRF 21)
- QA: encoded contact sheet + chunk seams at 17.6 s and 35.2 s checked, no jumps
In progress: none
Next step: apply the user's feedback in a v2 (minor: star tip touches "05 —" / HAND IN HAND at 34–36 s)
Open issues / user feedback not yet fixed: none yet. Await the user's review of v1.
Key decisions & preferences:
- 9:16 vertical (the supplied videos are portrait); key text kept in the top band, clear of platform UI
- Tagline taken from the event banner: "Let's defeat breast cancer together"; Arabic end line "معاً ضد سرطان الثدي" from the event board
- Repo is public: event photos/videos, logo, siren.json and renders are gitignored
Key files: src/main.js, src/timing.js, scripts/render.mjs, scripts/music.py, scripts/build.sh, plan/storyboard.md
