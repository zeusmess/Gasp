"""Generates every voice line with an Egyptian Microsoft voice, then re-mixes the video's audio.

The voice is "Salma" (ar-EG-SalmaNeural, female Egyptian). The words she says are the
lines below — the name in the film stays "نادية".

Usage (inside this folder):
    pip install edge-tts
    python make_voice.py
"""
import asyncio
import os
import subprocess

import edge_tts

VOICE = "ar-EG-SalmaNeural"  # female Egyptian voice (male: ar-EG-ShakirNeural)
HERE = os.path.dirname(os.path.abspath(__file__))

# file name -> (what she says, speed)
LINES = {
    "call":  ("نادية!", "-5%"),
    "call2": ("نادية؟", "-15%"),
    "vo1":   ("كل يوم… نفس الاسم.", "-10%"),
    "vo2":   ("لحد ما في يوم… الاسم اتنادى… ومحدش ردّ.", "-10%"),
    "vo3":   ("واحدة من كل تمانية ستات.", "-10%"),
    "vo4":   ("بس نادية لاحظت بدري… وكشفت بدري.", "-10%"),
    "vo5":   ("فاسمها لسه بيتنادى.", "-10%"),
    "vo6":   ("خلّي اسمك يفضل يتنادى. افحصي بدري.", "-10%"),
}


async def main():
    os.makedirs(os.path.join(HERE, "audio"), exist_ok=True)
    for name, (text, rate) in LINES.items():
        path = os.path.join(HERE, "audio", f"{name}.mp3")
        await edge_tts.Communicate(text, VOICE, rate=rate).save(path)
        print(f"✓ {name}.mp3  —  {text}")


asyncio.run(main())
print("\nMixing the new voice into name-called.mp4 …")
subprocess.run(["node", "render.mjs", "--audio-only"], cwd=HERE, check=True)
print("Done! Open name-called.mp4")
