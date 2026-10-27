# LOG

- 2026-10-27: Brief: Starbucks × Pink October motion graphic using the event photos and videos, music, the Starbucks logo, and the 3D Siren stepping out to hug the photos, with the line "let's (defeat) breast cancer together".
- Probed media: videos are 1024×576 with −90° rotation, so portrait 576×1024. That set the format to 9:16 at 1080×1920.
- Fonts: Montserrat, Playfair Display, Great Vibes and Cairo from Google Fonts (OFL), localised to assets/fonts.
- extract_siren.py: circle fit (638.6, 643.1, r≈638); white components split into center and left/right tails; tails cut into 3 hinged segments each; green linework plates via closing (vertical kernel for tail stripes).
- Engine: Three.js 0.170 + GSAP 3.15 (repo dist). Deterministic renderAt(t). SwiftShader WebGL in headless Chromium, about 1.5 s per full-res frame.
- Fix: shared-state fromTo tweens had to use immediateRender:false (the logo was appearing early and the siren was hidden).
- Fix: gradient text with background-clip:text must sit on leaf spans only (it was rendering as pink blocks).
- Hug read flat from the front. Fixed with a 3/4 camera swinging side to side per bar, mirrored pearl backs on the tails, and curl 0.85 rad per segment so the tips cross in front of the card.
- Gallery: the orbit sits behind her during the hugs, then swings forward (depth 2.2, scale 1.2) for "together".
- Music: pads high-passed at 160 Hz (they were muddy); section dynamics curve added; LRA 5.6 LU before loudnorm.
- Final render started as 3 parallel chunks.
- Final: 3×528 frames (~25 min each, in parallel); build.sh muxed with two-pass loudnorm; share copy at CRF 21; delivered v1.
