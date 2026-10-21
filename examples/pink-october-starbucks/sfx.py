"""Synthesizes the sound design for the Pink October story, synced to the GSAP timeline.

Writes audio/sfx.wav (effects) and audio/music.wav (soft lo-fi pad + felt piano).
Usage: python3 sfx.py   (needs numpy + scipy)
"""
import os
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
DUR = 33.4
N = int(SR * DUR)
rng = np.random.default_rng(7)
HERE = os.path.dirname(os.path.abspath(__file__))


def t_(d):
    return np.arange(int(SR * d)) / SR


def lp(x, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def sweep_bp(x, f0, f1, q=0.6, block=512):
    """Band-pass whose centre glides from f0 to f1 (exponential)."""
    y = np.zeros_like(x)
    n = len(x)
    for i in range(0, n, block):
        c = f0 * (f1 / f0) ** (i / n)
        lo, hi = max(c * (1 - q), 30), min(c * (1 + q), SR / 2 - 100)
        seg = x[max(0, i - 2048):i + block]
        y[i:i + block] = bp(seg, lo, hi)[-len(x[i:i + block]):]
    return y


def env_adr(n, a, d, curve=4.0):
    """Attack (s) then exponential decay to the end."""
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-4), np.exp(-(t - a) / d * curve / 4))
    return e


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


class Track:
    def __init__(self):
        self.L = np.zeros(N)
        self.R = np.zeros(N)

    def add(self, sig, at, gain=1.0, pan=0.0):
        i = int(at * SR)
        if i >= N:
            return
        s = sig[: N - i] * gain
        self.L[i:i + len(s)] += s * np.sqrt((1 - pan) / 2)
        self.R[i:i + len(s)] += s * np.sqrt((1 + pan) / 2)

    def reverb(self, wet=0.3, length=2.2, damp=4000):
        t = t_(length)
        out = []
        for ch in (self.L, self.R):
            ir = lp(rng.standard_normal(len(t)), damp) * np.exp(-t * 3.2)
            ir /= np.sqrt(np.sum(ir ** 2))
            out.append(ch + wet * fftconvolve(ch, ir)[:N])
        self.L, self.R = out


# ---------------------------------------------------------------- sound kits
def drip():
    t = t_(0.35)
    f = 700 + 1300 * (1 - np.exp(-t * 60))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28)
    click = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 400) * 0.3
    return body + click


def sub_boom(f0=62, f1=38, d=1.2):
    t = t_(d)
    f = f1 + (f0 - f1) * np.exp(-t * 6)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.5)
    s *= np.minimum(t / 0.005, 1)
    return s + lp(rng.standard_normal(len(t)), 180) * np.exp(-t * 8) * 0.4


def whoosh(d=1.0, f0=400, f1=3000, peak=0.6):
    t = t_(d)
    x = sweep_bp(rng.standard_normal(len(t)), f0, f1)
    p = t / d
    e = np.where(p < peak, (p / peak) ** 2, ((1 - p) / (1 - peak)) ** 1.5)
    return x * e * 2.2


def pour(d=2.2):
    t = t_(d)
    stream = bp(rng.standard_normal(len(t)), 400, 2200) * 0.25
    stream *= 0.7 + 0.3 * lp(rng.standard_normal(len(t)), 12) * 8
    bubbles = np.zeros(len(t))
    for _ in range(int(d * 70)):
        i = rng.integers(0, len(t) - 4000)
        bt = t_(rng.uniform(0.02, 0.06))
        f = rng.uniform(500, 1600) * (1 + bt * 18)
        bubbles[i:i + len(bt)] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-bt * 70) * rng.uniform(.1, .35)
    e = np.minimum(t / 0.25, 1) * np.minimum((d - t) / 0.4, 1)
    return (stream + bubbles) * e


def bell(freq, d=2.5, bright=1.0):
    t = t_(d)
    s = np.zeros(len(t))
    for ratio, amp, dec in ((1, 1, 1.0), (2.0, .5 * bright, 1.6), (3.01, .25 * bright, 2.4), (4.2, .12 * bright, 3.5)):
        s += amp * np.sin(2 * np.pi * freq * ratio * t) * np.exp(-t * dec * 2.2 / d * 2)
    return s * np.minimum(t / 0.003, 1) * 0.5


def pop(freq=500):
    t = t_(0.12)
    f = freq * (1 + 1.4 * (1 - np.exp(-t * 80)))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45) * np.minimum(t / 0.002, 1)


def heartbeat():
    def thump(f, g):
        t = t_(0.25)
        return np.sin(2 * np.pi * f * t) * np.exp(-t * 22) * np.minimum(t / 0.004, 1) * g
    s = np.zeros(int(SR * 0.6))
    a, b = thump(58, 1.0), thump(50, 0.7)
    s[:len(a)] += a
    j = int(0.19 * SR)
    s[j:j + len(b)] += b
    return lp(s, 200)


def tick(high=True):
    t = t_(0.04)
    f = 3200 if high else 2600
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 180) + hp(rng.standard_normal(len(t)), 4000) * np.exp(-t * 500) * .4)


def riser(d=1.2):
    t = t_(d)
    x = sweep_bp(rng.standard_normal(len(t)), 300, 6000, q=0.5)
    f = 200 * (8 ** (t / d))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.15
    return (x * 1.6 + tone) * (t / d) ** 2.2


def sparkle(d=0.9, n=14):
    s = np.zeros(int(SR * (d + 0.5)))
    for k in range(n):
        f = midi(rng.choice([84, 86, 89, 91, 93, 96, 98]))
        b = bell(f, 0.5, 0.3) * 0.25
        i = int(SR * d * k / n)
        s[i:i + len(b)] += b
    return s


# ---------------------------------------------------------------- SFX timeline (seconds match index.html)
fx = Track()
fx.add(lp(rng.standard_normal(N), 900) * 0.012, 0)                     # room tone
fx.add(whoosh(1.4, 2500, 500, .85), 0.9, 0.35)                          # drop falls
fx.add(drip(), 2.3, 0.9)                                                 # drop hits
fx.add(sub_boom(), 2.3, 0.7)                                             # cup appears
for k in range(3):                                                       # ripples
    fx.add(bell(midi(88 - k * 5), 1.6, .4), 2.35 + k * 0.3, 0.12, pan=(-0.4, 0.4, 0)[k])
fx.add(pour(2.3), 4.5, 0.55)                                             # milk pour draws heart
fx.add(whoosh(1.4, 300, 4000, .7), 7.2, 0.4)                             # heart -> ribbon morph
fx.add(sparkle(1.0), 7.6, 0.6)
fx.add(bell(midi(81), 3.0), 8.4, 0.35)                                   # ribbon glows
fx.add(whoosh(1.2, 2000, 300, .5), 10.2, 0.35)                           # cup shrinks into grid
for k in range(7):                                                       # 7 cups pop in
    fx.add(pop(rng.uniform(380, 620)), 10.8 + k * 0.08, 0.35, pan=rng.uniform(-.6, .6))
fx.add(heartbeat(), 12.6, 1.0)                                           # pink cup pulses
fx.add(heartbeat(), 13.8, 0.9)
for k in range(7):                                                       # cups pop out
    fx.add(pop(rng.uniform(700, 900))[::-1] * 0.7, 15.4 + k * 0.04, 0.25, pan=rng.uniform(-.6, .6))
fx.add(whoosh(1.1, 400, 2500, .6), 15.7, 0.3)
for k in range(int(4.2 / 0.5) + 1):                                      # 5-minute timer ticks
    fx.add(tick(k % 2 == 0), 16.6 + k * 0.5, 0.32, pan=(-.2 if k % 2 else .2))
fx.add(bell(midi(84), 2.0), 20.8, 0.25)                                  # timer complete
fx.add(whoosh(1.0, 500, 5000, .9), 21.3, 0.45)                           # cup flies up
for k in range(3):                                                       # side cups land
    fx.add(whoosh(0.6, 3000, 600, .3), 22.0 + k * 0.12, 0.25, pan=(-.5, 0, .5)[k])
    fx.add(sub_boom(90, 60, 0.4), 22.35 + k * 0.12, 0.35)
for k, m in enumerate((76, 79, 84)):                                     # sleeves turn pink
    fx.add(bell(midi(m), 2.2), 23.0 + k * 0.25, 0.3, pan=(-.5, 0, .5)[k])
fx.add(whoosh(0.8, 600, 3000, .9), 27.0, 0.35)                           # cups exit
fx.add(riser(1.2), 26.9, 0.5)                                            # build to logo
fx.add(sub_boom(70, 35, 2.0), 28.1, 1.0)                                 # logo impact
fx.add(bell(midi(77), 4.0), 28.1, 0.3, pan=-.2)
fx.add(bell(midi(81), 4.0), 28.1, 0.25, pan=.2)
fx.add(sparkle(0.9, 12), 29.2, 0.7)                                      # shine sweep
fx.add(pop(900), 29.4, 0.4)                                              # ribbon pin
fx.reverb(0.35)

# ---------------------------------------------------------------- music bed (80 BPM, D minor -> F major)
mu = Track()
chords = [  # (start, end, notes)
    (2.3, 6.4, [50, 57, 60, 64, 65]),    # Dm(add9)
    (6.4, 10.2, [46, 53, 57, 60, 62]),   # Bbmaj7
    (10.2, 13.0, [43, 50, 53, 57, 58]),  # Gm7
    (13.0, 15.6, [46, 53, 57, 60, 65]),  # Bbmaj7
    (15.6, 18.6, [45, 53, 57, 60, 64]),  # F/A
    (18.6, 21.6, [48, 55, 60, 62, 67]),  # Csus2
    (21.6, 24.3, [46, 53, 58, 62, 65]),  # Bb
    (24.3, 27.2, [48, 55, 60, 64, 67]),  # C
    (28.1, 33.4, [41, 53, 57, 60, 64, 67]),  # Fmaj9 (resolve on the logo)
]


def pad_note(f, d):
    t = t_(d)
    s = np.zeros(len(t))
    for det in (-0.004, 0, 0.004):
        s += 2 * ((t * f * (1 + det)) % 1) - 1
    s = lp(s, 1100, 2)
    e = np.minimum(t / 0.9, 1) * np.minimum((d - t) / 1.0, 1).clip(0)
    return s * e * (1 + 0.15 * np.sin(2 * np.pi * 0.3 * t))


def piano(f, d=2.0):
    t = t_(d)
    s = np.sin(2 * np.pi * f * t) + .3 * np.sin(4 * np.pi * f * t) * np.exp(-t * 3) + .1 * np.sin(6 * np.pi * f * t) * np.exp(-t * 6)
    return lp(s * np.exp(-t * 2.2) * np.minimum(t / 0.006, 1), 2500)


mu.add(lp(np.sin(2 * np.pi * midi(38) * t_(2.6)), 300) * np.minimum(t_(2.6) / 1.5, 1), 0, 0.25)  # opening drone
for s, e, notes in chords:
    d = e - s + 1.0
    for k, m in enumerate(notes):
        mu.add(pad_note(midi(m), d), s, 0.05, pan=(k / (len(notes) - 1) - .5) * .8)
beat = 60 / 80
for s, e, notes in chords:
    if s < 4.5:
        continue
    arp = notes[1:] + [notes[2] + 12]
    k = 0
    while s + k * beat / 2 < e - 0.2:
        m = arp[(k * 3) % len(arp)] + 12
        mu.add(piano(midi(m)), s + k * beat / 2, 0.09 if k % 2 == 0 else 0.06, pan=rng.uniform(-.3, .3))
        k += 1
mu.reverb(0.5, 3.0, 3000)
fade = np.minimum(np.arange(N) / SR / 0.5, 1) * np.minimum((DUR - np.arange(N) / SR) / 2.5, 1)
mu.L *= fade
mu.R *= fade


# ---------------------------------------------------------------- write
def write(track, name, peak_db=-1.0):
    st = np.stack([track.L, track.R], axis=1)
    st = np.tanh(st * 1.2) / 1.2
    st *= 10 ** (peak_db / 20) / np.max(np.abs(st))
    os.makedirs(os.path.join(HERE, "audio"), exist_ok=True)
    with wave.open(os.path.join(HERE, "audio", name), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((st * 32767).astype("<i2").tobytes())
    print("wrote", name)


write(fx, "sfx.wav")
write(mu, "music.wav", -3.0)
