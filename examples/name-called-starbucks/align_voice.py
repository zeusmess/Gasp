"""Cuts one continuous ElevenLabs take into its lines and places each on the film's timeline.

Input : audio/elevenlabs-take.mp3   (the single v3 take, ELEVENLABS.md section 7)
Output: audio/voice-aligned.mp3     (45 s, every line at its exact second — render.mjs uses it automatically)

The CUES table maps [start, end] inside the take (found with silence detection) to the second it
must land on in the video. Barista calls get a café room sound; narration stays close and warm.
Usage: python3 align_voice.py   (needs numpy, scipy, ffmpeg)
"""
import os
import subprocess

import numpy as np
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "audio", "elevenlabs-take.mp3")
OUT = os.path.join(HERE, "audio", "voice-aligned.mp3")
SR, DUR = 48000, 45.2

# name, take start, take end, video time where the take start lands, role
CUES = [
    ("vo1   كل يوم… الساعة تمانية وربع،",          0.000,  2.509,  0.35, "narrator"),
    ("call1 نادية! (السبت)",                      2.877,  3.451,  2.90, "call"),
    ("vo2   نفس الاسم.",                          3.749,  4.956,  3.80, "narrator"),
    ("call2 نادْيــا! (الحد)",                     5.515,  6.484,  5.80, "call"),
    ("call3 نادية! (الاتنين)",                    6.962,  7.342,  7.55, "call"),
    ("call4 نادية. (التلات)",                     7.735,  8.100,  8.75, "call"),
    ("call5 نادية! (الأربع)",                     9.610, 10.214, 11.90, "call"),
    ("call6 نادية…؟",                             10.732, 11.260, 13.30, "call-far"),
    ("vo3   لحد ما في يوم… ومحدش ردّ.",            11.821, 16.538, 14.20, "narrator"),
    ("vo4   واحدة من كل تمانية ستات…",              17.208, 20.934, 19.00, "narrator"),
    ("vo5   بس نادية… وكشفت بدري.",                21.599, 24.436, 27.30, "narrator"),
    ("call7 (شهقة) نادية!!",                      24.890, 26.088, 35.508, "call"),   # the name itself lands on 36.0
    ("vo6   فاسمها لسه… بيتنادى.",                 26.338, 28.212, 36.80, "narrator"),
    ("vo7   خلّي اسمك يفضل يتنادى.",               28.628, 30.341, 40.60, "narrator"),
    ("vo8   افحصي بدري.",                         30.628, 31.406, 42.60, "narrator"),
]
PRE, POST = 0.04, 0.12  # breathing room kept around each cut

FX = {
    "narrator": "highpass=f=80,equalizer=f=220:t=q:w=1:g=1.5,equalizer=f=5000:t=q:w=1.5:g=1.5,"
                "acompressor=threshold=-22dB:ratio=2.5:attack=8:release=120:makeup=2,aecho=0.9:0.25:28:0.06",
    "call":     "highpass=f=160,equalizer=f=2800:t=q:w=1:g=2,aecho=0.8:0.55:42|95|160:0.28|0.16|0.08",
    "call-far": "highpass=f=200,lowpass=f=6000,aecho=0.8:0.65:60|140|260:0.35|0.22|0.12",
}
PAN = {"narrator": 0.0, "call": 0.18, "call-far": 0.25}


def decode(start, end, fx):
    a, b = max(start - PRE, 0), end + POST
    fade = f"afade=t=in:d=0.015,afade=t=out:st={b - a - 0.04:.3f}:d=0.04"
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-i", SRC,
                          "-af", f"{fade},{FX[fx]}", "-ar", str(SR), "-ac", "1", "-f", "s16le", "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, "<i2").astype(np.float64) / 32768, start - a


track = np.zeros((int(SR * DUR), 2))
for name, start, end, at, role in CUES:
    clip, lead = decode(start, end, role)
    i = int(round((at - lead) * SR))
    clip = clip[: len(track) - i]
    p = PAN[role]
    track[i:i + len(clip), 0] += clip * np.sqrt((1 - p) / 2) * np.sqrt(2)
    track[i:i + len(clip), 1] += clip * np.sqrt((1 + p) / 2) * np.sqrt(2)
    print(f"{at:6.2f}s → {at + end - start:6.2f}s   {name}")

track *= 10 ** (-1.5 / 20) / np.max(np.abs(track))
tmp = OUT.replace(".mp3", ".tmp.wav")
wavfile.write(tmp, SR, (track * 32767).astype("<i2"))
# loudness-match the voice so it sits clearly above the music and effects
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", tmp, "-af", "loudnorm=I=-15:TP=-1.5:LRA=11",
                "-ar", str(SR), "-b:a", "256k", OUT], check=True)
os.remove(tmp)
print("wrote", OUT)
