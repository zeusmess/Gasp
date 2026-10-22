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
    "call1": ("نادية!", "+0%"),
    "call2": ("نادية!", "-5%"),
    "call3": ("نادية!", "+15%"),
    "call4": ("نادية!", "+10%"),
    "call5": ("نادية!", "+0%"),
    "call6": ("نادية…؟", "-20%"),
    "call7": ("نادية!!", "+0%"),
    "vo1":   ("كل يوم… الساعة تمانية وربع،", "-5%"),
    "vo2":   ("نفس الاسم.", "-5%"),
    "vo3":   ("لحد ما في يوم… الاسم اتنادى… ومحدش ردّ.", "-12%"),
    "vo4":   ("واحدة من كل تمانية ستات… هتواجه سرطان الثدي في حياتها.", "-5%"),
    "vo5":   ("بس نادية… لاحظت بدري… وكشفت بدري.", "-8%"),
    "vo6":   ("فاسمها لسه… بيتنادى.", "-8%"),
    "vo7":   ("خلّي اسمك يفضل يتنادى.", "-5%"),
    "vo8":   ("افحصي بدري.", "-5%"),
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
