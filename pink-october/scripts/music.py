"""Synthesise the soundtrack + SFX in code, locked to cache/timing.json.

100 BPM, A major, vi–IV–I–V (F#m D A E). A heartbeat motif opens and returns
in the breakdown; every embrace lands on a bar downbeat with a warm hit.
Usage: python3 scripts/music.py [out.wav]
"""
import json
import subprocess
import sys

import numpy as np
from scipy.signal import butter, fftconvolve, lfilter, sosfilt

SR = 48000
TM = json.load(open("cache/timing.json"))
T, HUGS, DUR = TM["T"], TM["HUGS"], TM["DURATION"]
BEAT = 60 / TM["BPM"]
BAR = BEAT * 4
N = int((DUR + 0.2) * SR)
rng = np.random.default_rng(7)

# buses: (stereo) dry music, reverb send, sfx
mus = np.zeros((2, N))
pads = np.zeros((2, N))
verb = np.zeros((2, N))
sfx = np.zeros((2, N))


def place(bus, t, sig, gain=1.0, pan=0.0, send=None, send_gain=0.3):
    i = int(round(t * SR))
    if i >= N or i + len(sig) <= 0:
        return
    s = sig[: N - i] if i >= 0 else sig[-i:]
    i = max(i, 0)
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[0, i : i + len(s)] += s * gain * l * 1.414
    bus[1, i : i + len(s)] += s * gain * r * 1.414
    if send is not None:
        send[0, i : i + len(s)] += s * gain * send_gain * l
        send[1, i : i + len(s)] += s * gain * send_gain * r


def tt(d):
    return np.arange(int(d * SR)) / SR


def lp(x, f, o=2):
    return sosfilt(butter(o, f, "low", fs=SR, output="sos"), x)


def hp(x, f, o=2):
    return sosfilt(butter(o, f, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, o=2):
    return sosfilt(butter(o, [lo, hi], "band", fs=SR, output="sos"), x)


def env(n, a=0.005, r=0.1):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}


def hz(name):
    n, o = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((NOTE[n] + 12 * (o + 1) - 69) / 12)


# ---------------- instruments ----------------
def piano(f, d=3.5, vel=1.0):
    t = tt(d)
    s = np.zeros_like(t)
    for k in range(1, 11):
        fk = f * k * np.sqrt(1 + 0.0004 * k * k)
        if fk > SR / 2.2:
            break
        s += (1 / k**1.25) * np.sin(2 * np.pi * fk * t + rng.random()) * np.exp(-t * (0.9 + 0.55 * k) * (f / 440) ** 0.3)
    ham = lp(rng.standard_normal(int(0.012 * SR)), 3000) * np.linspace(1, 0, int(0.012 * SR))
    s[: len(ham)] += ham * 0.15
    return s * env(len(t), 0.002, 0.3) * vel * 0.32


def pad_note(f, d, bright=1800):
    t = tt(d)
    s = np.zeros_like(t)
    for det in (-0.011, -0.004, 0.003, 0.009):
        ph = rng.random()
        s += 2 * ((f * (1 + det) * t + ph) % 1.0) - 1
    s = hp(lp(s / 4, bright), 160)
    return s * env(len(t), min(0.9, d / 3), min(1.2, d / 3)) * 0.16


_ks = {}


def pluck(f, d=1.1):
    key = round(f, 2)
    if key not in _ks:
        n = int(SR / f)
        x = np.zeros(int(d * SR))
        x[:n] = lp(rng.uniform(-1, 1, n), 4000)
        a = np.zeros(n + 2)
        a[0], a[n], a[n + 1] = 1, -0.4975, -0.4975
        y = lfilter([1], a, x)
        _ks[key] = hp(y, 120) * env(len(y), 0.001, 0.2) * 0.4
    return _ks[key]


def bell(f, d=2.6, vel=1.0):
    t = tt(d)
    idx = 2.2 * np.exp(-t * 3)
    s = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 3.5 * t)) * np.exp(-t * 1.6)
    s += 0.3 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 3)
    return s * env(len(t), 0.002, 0.4) * vel * 0.22


def bass(f, d):
    t = tt(d)
    s = np.tanh(1.6 * (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)))
    return lp(s, 900) * env(len(t), 0.004, 0.08) * 0.42


def kick(v=1.0):
    t = tt(0.45)
    ph = 2 * np.pi * np.cumsum(45 + 95 * np.exp(-t * 32)) / SR
    s = np.sin(ph) * np.exp(-t * 7.5)
    s[:120] += rng.standard_normal(120) * np.linspace(0.5, 0, 120)
    return np.tanh(s * 1.4) * v * 0.85


def heartbeat(v=1.0):
    def thump(a):
        t = tt(0.32)
        ph = 2 * np.pi * np.cumsum(38 + 40 * np.exp(-t * 25)) / SR
        return lp(np.sin(ph) * np.exp(-t * 11), 260) * a

    out = np.zeros(int(0.6 * SR))
    a = thump(1.0)
    b = thump(0.7)
    out[: len(a)] += a
    o = int(0.21 * SR)
    out[o : o + len(b)] += b
    return out * v * 1.1


def clap(v=1.0):
    n = int(0.25 * SR)
    s = np.zeros(n)
    for k, off in enumerate((0, 0.011, 0.022, 0.034)):
        i = int(off * SR)
        L = n - i
        s[i:] += rng.standard_normal(L) * np.exp(-np.arange(L) / SR * (90 if k < 3 else 16))
    return bp(s, 900, 4200) * v * 0.32


def hat(v=1.0, open_=False):
    n = int((0.22 if open_ else 0.06) * SR)
    s = hp(rng.standard_normal(n), 7000) * np.exp(-np.arange(n) / SR * (14 if open_ else 70))
    return s * v * 0.16


def whoosh(d=0.7, v=1.0, lo=500, hi=3500):
    n = int(d * SR)
    x = rng.standard_normal(n)
    k = np.linspace(0, 1, n)
    shape = np.sin(np.pi * k**0.75) ** 2
    s = bp(x, lo, hi) * shape
    s += 0.4 * bp(x, hi, min(hi * 2.5, 16000)) * shape**2
    return s * v * 0.5


def riser(d=2.0, v=1.0):
    n = int(d * SR)
    x = rng.standard_normal(n)
    k = np.linspace(0, 1, n)
    out = np.zeros(n)
    bands = [(200, 500), (400, 1000), (900, 2200), (2000, 5000), (4500, 11000)]
    for j, (lo, hi) in enumerate(bands):
        c = (j + 0.5) / len(bands)
        out += bp(x, lo, hi) * np.exp(-((k - c) ** 2) / 0.04)
    t = tt(d)
    tone = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (2 * k)) / SR) * 0.15
    return (out * 0.6 + tone) * k**1.6 * v * 0.5


def impact(v=1.0):
    t = tt(2.2)
    ph = 2 * np.pi * np.cumsum(38 + 70 * np.exp(-t * 9)) / SR
    boom = np.sin(ph) * np.exp(-t * 2.3)
    nz = lp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 9) * 0.6
    return np.tanh((boom + nz) * 1.3) * v * 0.8


def shimmer(v=1.0, notes=("A5", "C#6", "E6", "A6", "C#7")):
    out = np.zeros(int(3.2 * SR))
    for j, nm in enumerate(notes):
        b = bell(hz(nm), 2.6, 0.7)
        i = int(j * 0.045 * SR)
        out[i : i + len(b)] += b
    return out * v


def embrace(v=1.0):
    """warm hug hit: soft low swell + heartbeat thump"""
    t = tt(1.6)
    sw = lp(rng.standard_normal(len(t)), 600) * np.exp(-t * 3) * 0.5
    sub = np.sin(2 * np.pi * 55 * t) * np.exp(-t * 3.5) * 0.7
    out = sw + sub
    hb = heartbeat(0.8)
    out[: len(hb)] += hb
    return out * v


# ---------------- arrangement ----------------
PROG = [
    ("F#", ["F#3", "A3", "C#4", "E4"], ["F#2"]),
    ("D", ["D3", "F#3", "A3", "C#4"], ["D2"]),
    ("A", ["A3", "C#4", "E4", "B4"], ["A2"]),
    ("E", ["E3", "G#3", "B3", "D#4"], ["E2"]),
]
ARP = [0, 2, 3, 1, 2, 3, 1, 2]  # chord-tone indices per 8th
NBARS = int(round(DUR / BAR))


def chord(b):
    if b == NBARS - 2:
        return PROG[1]
    if b >= NBARS - 1:
        return PROG[2]
    return PROG[b % 4]


def sec(b):
    t0 = b * BAR
    if t0 < T["coinLand"]:
        return "intro"
    if t0 < T["hug0"]:
        return "reveal"
    if t0 < T["aware"]:
        return "groove"
    if t0 < T["finale"]:
        return "break"
    if t0 < T["end"]:
        return "chorus"
    return "outro"


melody = {  # bar-relative (beat, note, len) for the chorus bell hook
    0: [(0, "C#5", 1), (1, "E5", 1), (2, "F#5", 1.5), (3.5, "E5", 0.5)],
    1: [(0, "D5", 1), (1, "C#5", 1), (2, "A4", 2)],
    2: [(0, "C#5", 1), (1, "E5", 1), (2, "A5", 1.5), (3.5, "G#5", 0.5)],
    3: [(0, "F#5", 1), (1, "E5", 1), (2, "B4", 2)],
}

kick_env = np.zeros(N)
for b in range(NBARS):
    t0 = b * BAR
    name, notes, bnotes = chord(b)
    s = sec(b)
    # pads every bar
    bright = {"intro": 900, "reveal": 1400, "groove": 2200, "break": 800, "chorus": 3200, "outro": 1500}[s]
    pv = {"intro": 0.8, "reveal": 1.0, "groove": 0.9, "break": 0.9, "chorus": 1.15, "outro": 1.0}[s]
    for j, nm in enumerate(notes):
        place(pads, t0, pad_note(hz(nm), BAR + 0.6, bright), pv, pan=(-0.5 + j / 3), send=verb, send_gain=0.5)
    # piano: half-note chords, softer in groove (plucks carry it)
    pvel = {"intro": 0.9, "reveal": 1.0, "groove": 0.55, "break": 1.0, "chorus": 0.7, "outro": 1.0}[s]
    for half in (0, 2):
        if s == "outro" and half == 2:
            continue
        for j, nm in enumerate(notes[:3]):
            place(mus, t0 + half * BEAT + j * 0.012, piano(hz(nm), 3.4 if s != "outro" else 5.5, pvel * (0.95 if half else 1.1)), 1.0, pan=-0.2 + 0.2 * j, send=verb, send_gain=0.35)
        place(mus, t0 + half * BEAT, piano(hz(bnotes[0]) * 2, 3.4, pvel * 0.8), 1.0, pan=-0.3, send=verb, send_gain=0.3)
    # intro/break piano arpeggio in 8ths (top voice)
    if s in ("intro", "break"):
        for k in range(8):
            nm = notes[ARP[k]]
            f = hz(nm) * 2
            place(mus, t0 + k * BEAT / 2, piano(f, 2.0, 0.42 if k % 2 else 0.55), 1.0, pan=0.25, send=verb, send_gain=0.5)
    # plucked arp in groove & chorus
    if s in ("groove", "chorus"):
        for k in range(8):
            f = hz(notes[ARP[k]]) * 2
            place(mus, t0 + k * BEAT / 2, pluck(f), 0.8 if k % 2 else 1.0, pan=(0.35 if k % 2 else -0.35), send=verb, send_gain=0.25)
    # bass
    if s in ("reveal", "groove", "chorus", "outro"):
        bf = hz(bnotes[0])
        if s == "reveal":
            place(mus, t0, bass(bf, BAR * 0.95), 0.8)
        elif s == "outro":
            place(mus, t0, bass(bf, BAR * 1.0), 0.9)
        else:
            for k in range(8):
                if k in (0, 3, 4, 6, 7) or s == "chorus":
                    place(mus, t0 + k * BEAT / 2, bass(bf * (2 if k == 7 else 1), BEAT / 2 * 0.9), 0.95)
    # drums
    if s == "intro" or s == "break":
        for beat in (0, 2):
            if s == "break" or b >= 1:
                place(sfx, t0 + beat * BEAT, heartbeat(0.9 if s == "break" else 0.7), 1.0)
    if s == "reveal":
        for beat in (0, 2):
            place(mus, t0 + beat * BEAT, heartbeat(1.0), 1.0)
        place(mus, t0 + 3.5 * BEAT, hat(0.6), 1.0, 0.3)
    if s in ("groove", "chorus"):
        for beat in range(4):
            place(mus, t0 + beat * BEAT, kick(0.95 if s == "chorus" else 0.8), 1.0)
            i = int((t0 + beat * BEAT) * SR)
            e = np.exp(-np.arange(int(0.3 * SR)) / SR * 9)
            kick_env[i : i + len(e)] = np.maximum(kick_env[i : i + len(e)], e[: max(0, min(len(e), N - i))])
            if beat in (1, 3):
                place(mus, t0 + beat * BEAT, clap(1.0 if s == "chorus" else 0.85), 1.0, pan=0.05, send=verb, send_gain=0.35)
            for half in (0, 1):
                ot = s == "chorus" and half == 1
                place(mus, t0 + (beat + 0.5 * half) * BEAT, hat(0.9 if half else 0.55, open_=ot), 1.0, pan=0.25)
    if s == "chorus":
        mb = (b - int(round(T["finale"] / BAR))) % 4
        for beat, nm, ln in melody[mb]:
            place(mus, t0 + beat * BEAT, bell(hz(nm), 2.4, 1.0), 1.0, pan=0.1, send=verb, send_gain=0.55)
            place(mus, t0 + beat * BEAT, piano(hz(nm), 2.0, 0.5), 1.0, pan=-0.1, send=verb, send_gain=0.4)
    if s == "outro" and b == NBARS - 1:
        for j, nm in enumerate(("A4", "C#5", "E5", "A5")):
            place(mus, t0 + j * 0.09, bell(hz(nm), 3.0, 0.8), 1.0, pan=-0.3 + 0.2 * j, send=verb, send_gain=0.6)

# sidechain pump on pads (modern feel)
pads *= 1 - 0.45 * kick_env
# stop everything just before the drop for a breath of silence
gap0, gap1 = int((T["finale"] - 0.32) * SR), int((T["finale"] - 0.02) * SR)
for bus in (mus, pads):
    bus[:, gap0:gap1] *= np.linspace(1, 0, gap1 - gap0) ** 2
    bus[:, gap1 : int(T["finale"] * SR)] = 0

# ---------------- sound design (synced to picture) ----------------
place(sfx, 0.05, shimmer(0.5, ("E6", "A6", "C#7")), 1.0, send=verb, send_gain=0.7)
place(sfx, 0.1, riser(1.7, 0.35), 1.0, pan=-0.2)
place(sfx, 1.8, impact(0.45), 1.0, send=verb, send_gain=0.4)
place(sfx, 1.8, shimmer(0.6), 1.0, send=verb, send_gain=0.6)
place(sfx, T["coinIn"], whoosh(0.9, 0.8, 300, 2500), 1.0, pan=0.3)
place(sfx, T["coinIn"] + 0.2, riser(T["coinLand"] - T["coinIn"] - 0.2, 0.75), 1.0)
place(sfx, T["coinLand"], impact(1.0), 1.0, send=verb, send_gain=0.5)
place(sfx, T["lift"], riser(1.2, 0.4), 1.0)
place(sfx, T["lift"] + 0.5, shimmer(0.8, ("A5", "C#6", "E6", "A6", "C#7", "E7")), 1.0, send=verb, send_gain=0.7)
place(sfx, T["lift"] + 1.1, whoosh(1.0, 0.5, 250, 1500), 1.0, pan=-0.4)
place(sfx, T["hug0"] - 0.9, riser(0.9, 0.5), 1.0)
for i, t0 in enumerate(HUGS + [T["hugVid"] + 0.15]):
    side = 1 if i % 2 == 0 else -1
    place(sfx, t0 - 0.65, whoosh(0.7, 0.75), 1.0, pan=0.6 * side)
    place(sfx, t0, embrace(0.95), 1.0, send=verb, send_gain=0.35)
    place(sfx, t0 + 0.22, shimmer(0.45, ("C#6", "E6", "A6")), 1.0, pan=-0.2 * side, send=verb, send_gain=0.6)
    place(sfx, t0 + 1.72, whoosh(0.8, 0.45, 600, 4000), 1.0, pan=-0.6 * side)
for i in range(4):
    place(sfx, T["gallery"] - 0.35 + i * 0.12, whoosh(0.6, 0.35, 700, 5000), 1.0, pan=(-0.7 + 0.45 * i))
place(sfx, T["video1"] - 0.95, riser(0.95, 0.8), 1.0)
place(sfx, T["video1"] - 0.6, whoosh(0.7, 0.8, 200, 2000), 1.0)
place(sfx, T["video1"], impact(0.6), 1.0, send=verb, send_gain=0.5)
place(sfx, T["collage"] - 0.35, whoosh(0.6, 0.7, 400, 3000), 1.0, pan=-0.6)
for i in range(4):
    place(sfx, T["collage"] - 0.25 + i * BEAT, whoosh(0.5, 0.45, 800, 6000), 1.0, pan=(0.6 if i % 2 else -0.6))
for i in range(3):  # one day / one colour / one cause
    place(sfx, T["collage"] + i * 1.2 + 0.1, impact(0.35), 1.0, send=verb, send_gain=0.3)
place(sfx, T["hugVid"] - 0.55, whoosh(0.7, 0.6, 300, 3000), 1.0, pan=0.5)
place(sfx, T["aware"] + 0.7, shimmer(0.6, ("E6", "A6", "C#7", "E7")), 1.0, send=verb, send_gain=0.8)
place(sfx, T["finale"] - 1.4, riser(1.1, 1.0), 1.0)
place(sfx, T["finale"], impact(1.1), 1.0, send=verb, send_gain=0.6)
place(sfx, T["finale"], shimmer(0.8, ("A5", "C#6", "E6", "A6", "C#7", "E7", "A7")), 1.0, send=verb, send_gain=0.7)
for i in range(10):
    place(sfx, T["finale"] + 0.05 + i * 0.13, whoosh(0.45, 0.22, 900, 7000), 1.0, pan=np.sin(i * 1.7) * 0.8)
place(sfx, T["text"] + 0.45, impact(0.3), 1.0, send=verb, send_gain=0.3)
place(sfx, T["end"] - 0.5, whoosh(0.9, 0.7, 300, 3000), 1.0)
place(sfx, T["end"], impact(0.9), 1.0, send=verb, send_gain=0.7)
place(sfx, T["end"] + 0.75, shimmer(0.7, ("A5", "E6", "A6", "C#7", "E7")), 1.0, send=verb, send_gain=0.8)
place(sfx, T["end"] + 1.3, impact(0.3), 1.0, send=verb, send_gain=0.4)

# ---------------- footage ambience: the awareness talk ----------------
talk = subprocess.run(["ffmpeg", "-v", "error", "-i", "assets/footage/talk.mp4", "-t", "4.9", "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True).stdout
talk = bp(np.frombuffer(talk, np.float32).astype(float), 180, 6500)
talk *= env(len(talk), 0.35, 0.6)
place(sfx, T["video1"], talk, 2.2)
duck = np.ones(N)
a, b_ = int((T["video1"] + 0.2) * SR), int((T["collage"] - 0.2) * SR)
ramp = int(0.3 * SR)
duck[a - ramp : a] = np.linspace(1, 0.55, ramp)
duck[a:b_] = 0.55
duck[b_ : b_ + ramp] = np.linspace(0.55, 1, ramp)

# ---------------- reverb + master ----------------
ir_t = tt(3.2)
ir = np.stack([rng.standard_normal(len(ir_t)), rng.standard_normal(len(ir_t))]) * np.exp(-ir_t * 6.9 / 2.9)
ir = np.stack([lp(ch, 6000) for ch in ir])
ir[:, : int(0.02 * SR)] = 0
wet = np.stack([fftconvolve(verb[c], ir[c])[:N] for c in range(2)])
wet *= 0.9 / (np.abs(wet).max() + 1e-9) * 0.45 * np.abs(verb).max() * 6

# section dynamics: quiet intro & breakdown, full chorus
def curve(points):
    xs, ys = zip(*points)
    return np.interp(np.arange(N) / SR, xs, ys)


dyn = curve([(0, 0.5), (T["coinLand"] - 0.1, 0.55), (T["coinLand"] + 0.2, 0.72), (T["hug0"] - 0.1, 0.75), (T["hug0"] + 0.2, 0.86),
             (T["aware"] - 0.1, 0.86), (T["aware"] + 0.3, 0.58), (T["finale"] - 0.5, 0.62), (T["finale"], 1.0), (T["end"], 1.0), (T["end"] + 1.5, 0.85), (DUR + 0.2, 0.8)])
mix = ((mus + pads) * duck + wet * duck) * dyn + sfx
mix = np.stack([hp(c, 28) for c in mix])
mix /= np.abs(mix).max() + 1e-9
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
fo = int(1.4 * SR)  # fade with the picture
end = int(DUR * SR)
mix[:, end - fo : end] *= np.linspace(1, 0, fo) ** 1.5
mix = mix[:, :end]

out = sys.argv[1] if len(sys.argv) > 1 else "assets/music/soundtrack_raw.wav"
pcm = (np.clip(mix.T, -1, 1) * 32767).astype("<i2")
import wave

with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", out, mix.shape[1] / SR, "s")
