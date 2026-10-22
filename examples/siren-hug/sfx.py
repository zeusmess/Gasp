"""Sound design for the siren-hug film, synced to index.html.

Writes audio/sfx.wav (café bed + magic + hug effects) and audio/music.wav (music box / piano + pads).
Usage: python3 sfx.py   (needs numpy + scipy)
"""
import os
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
DUR = 16.2
N = int(SR * DUR)
rng = np.random.default_rng(33)
HERE = os.path.dirname(os.path.abspath(__file__))


def t_(d):
    return np.arange(int(SR * d)) / SR


def lp(x, f):
    return sosfilt(butter(2, f, "low", fs=SR, output="sos"), x)


def hp(x, f):
    return sosfilt(butter(2, f, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], "band", fs=SR, output="sos"), x)


def sweep_bp(x, f0, f1, q=0.6, block=512):
    y = np.zeros_like(x)
    n = len(x)
    for i in range(0, n, block):
        c = f0 * (f1 / f0) ** (i / n)
        seg = x[max(0, i - 2048):i + block]
        y[i:i + block] = bp(seg, max(c * (1 - q), 30), min(c * (1 + q), SR / 2 - 100))[-len(x[i:i + block]):]
    return y


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def curve(points):
    ts, vs = zip(*points)
    return np.interp(np.arange(N) / SR, ts, vs)


class Track:
    def __init__(self):
        self.L, self.R = np.zeros(N), np.zeros(N)

    def add(self, sig, at, gain=1.0, pan=0.0):
        i = int(at * SR)
        s = sig[: N - i] * gain
        self.L[i:i + len(s)] += s * np.sqrt((1 - pan) / 2)
        self.R[i:i + len(s)] += s * np.sqrt((1 + pan) / 2)

    def reverb(self, wet, length=2.6, damp=4500, decay=2.6):
        t = t_(length)
        out = []
        for ch in (self.L, self.R):
            ir = lp(rng.standard_normal(len(t)), damp) * np.exp(-t * decay)
            out.append(ch + wet * fftconvolve(ch, ir / np.sqrt(np.sum(ir ** 2)))[:N])
        self.L, self.R = out


def whoosh(d, f0, f1, peak=0.6):
    t = t_(d)
    p = t / d
    e = np.where(p < peak, (p / peak) ** 2, ((1 - p) / (1 - peak)) ** 1.5)
    return sweep_bp(rng.standard_normal(len(t)), f0, f1) * e * 2.2


def bell(freq, d=2.5, bright=1.0):
    t = t_(d)
    s = sum(a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t * dc * 4.4 / d)
            for r, a, dc in ((1, 1, 1.0), (2.0, .5 * bright, 1.6), (3.01, .25 * bright, 2.4), (4.2, .12 * bright, 3.5)))
    return s * np.minimum(t / 0.003, 1) * 0.5


def sparkle(d=1.0, n=14, notes=(84, 86, 88, 91, 93, 96, 98)):
    s = np.zeros(int(SR * (d + .6)))
    for k in range(n):
        b = bell(midi(rng.choice(notes)), .5, .3) * .25 * rng.uniform(.6, 1)
        i = int(SR * d * k / n + rng.uniform(0, .03) * SR)
        s[i:i + len(b)] += b[:len(s) - i]
    return s


def shimmer_rise(d=1.2):
    """Magic glow: a rising cluster of soft bells over airy noise."""
    s = sparkle(d, 18, (79, 84, 86, 88, 91, 93, 96))
    air = sweep_bp(rng.standard_normal(int(SR * (d + .6))), 1500, 7000, .5)
    air *= np.concatenate([np.linspace(0, 1, int(SR * d)), np.linspace(1, 0, len(air) - int(SR * d))]) ** 2
    return s + air * .25


def soft_thump(d=1.4):
    t = t_(d)
    f = 48 + 40 * np.exp(-t * 7)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2) * np.minimum(t / 0.02, 1)
    return lp(s + lp(rng.standard_normal(len(t)), 220) * np.exp(-t * 9) * .3, 300)


def heartbeat():
    def thump(f, g):
        t = t_(0.3)
        return np.sin(2 * np.pi * f * t) * np.exp(-t * 18) * np.minimum(t / 0.004, 1) * g
    s = np.zeros(int(SR * .7))
    a, b = thump(56, 1), thump(48, .7)
    s[:len(a)] += a
    s[int(.2 * SR):int(.2 * SR) + len(b)] += b
    return lp(s, 180)


def pop(freq=600):
    t = t_(.12)
    f = freq * (1 + 1.4 * (1 - np.exp(-t * 80)))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45) * np.minimum(t / .002, 1)


# ---------------- café bed (quiet, keeps it real)
fx = Track()
room = lp(rng.standard_normal(N), 1400) * .04
murmur = np.zeros(N)
for v in range(5):
    lo = rng.uniform(260, 480)
    murmur += bp(rng.standard_normal(N), lo, lo * 2.6) * np.clip(lp(rng.standard_normal(N), 4.5) * 14, 0, 1) * .08
fx.L += room + murmur
fx.R += np.roll(room, 977) + np.roll(murmur, 5100)
for at in np.arange(.5, DUR, 1.3) + rng.uniform(0, .9, len(np.arange(.5, DUR, 1.3))):
    fx.add(bell(rng.uniform(2900, 5000), .35, .5), at, rng.uniform(.015, .04), pan=rng.uniform(-.8, .8))
bed = curve([(0, 0), (1.0, 1), (2.4, 1), (3.0, .45), (11.5, .45), (12.6, .8), (DUR - 1, .8), (DUR, 0)])
fx.L *= bed
fx.R *= bed

# ---------------- magic + hug
fx.add(shimmer_rise(1.3), 1.25, .55)                    # logo wakes up
fx.add(bell(midi(88), 2.0, .4), 1.95, .12, pan=-.2)
fx.add(pop(520), 2.6, .3)                               # she pops off the logo
fx.add(whoosh(1.4, 400, 3800, .45), 2.55, .45)          # steps out, towards camera
fx.add(sparkle(1.3, 20), 2.65, .55)                     # spark burst
fx.add(whoosh(1.3, 600, 2600, .5), 4.0, .32, pan=.2)    # rises over the cup
fx.add(whoosh(1.3, 2400, 500, .45), 5.3, .3, pan=-.2)   # settles behind it
fx.add(whoosh(1.0, 300, 1200, .7), 5.4, .25)            # arms open (breath)
fx.add(whoosh(.8, 1800, 400, .35), 6.85, .4)            # arms close in
fx.add(soft_thump(), 7.2, .9)                           # the hug lands
fx.add(heartbeat(), 7.35, .55)
fx.add(heartbeat(), 8.25, .45)
for k, m in enumerate((77, 81, 84, 89)):                # warm glow chord
    fx.add(bell(midi(m), 3.5, .5), 7.25 + k * .06, .14, pan=(k / 3 - .5) * .6)
fx.add(sparkle(.9, 10, (88, 91, 93, 96)), 7.6, .4)      # ribbon draws
for i in range(9):                                      # hearts float up
    fx.add(pop(rng.uniform(700, 1000)), 7.5 + i * .16, .12, pan=rng.uniform(-.5, .5))
fx.add(soft_thump(1.8), 12.6, .5)                       # end card
fx.add(sparkle(1.0, 12), 12.9, .45)
fx.reverb(.3)

# ---------------- music: music box + felt piano + pad (72 BPM, F major)
mu = Track()
beat = 60 / 72


def musicbox(f, d=2.2):
    t = t_(d)
    s = np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 3.98 * t) * np.exp(-t * 6) + .2 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 3)
    return s * np.exp(-t * 2.4) * np.minimum(t / .002, 1) * .5


def piano(f, d=3.0, vel=.8):
    t = t_(d)
    s = np.sin(2 * np.pi * f * t) + .35 * np.sin(4 * np.pi * f * t) * np.exp(-t * 3) + .1 * np.sin(6 * np.pi * f * t) * np.exp(-t * 6)
    return lp(s * np.exp(-t * 1.5) * np.minimum(t / .008, 1), 2400) * vel


def pad(f, d, cutoff=1000):
    t = t_(d)
    s = sum(2 * ((t * f * (1 + det)) % 1) - 1 for det in (-.005, 0, .005))
    return lp(s, cutoff) * np.minimum(t / 1.2, 1) * np.minimum((d - t) / 1.2, 1).clip(0)


melody = [(0, 77), (1, 81), (2, 84), (3, 81), (4, 79), (5, 77), (6, 76), (7, 77),          # bar-ish phrases
          (8, 81), (9, 84), (10, 86), (11, 84), (12, 81), (14, 84), (15, 89)]
for k, m in melody:
    at = .6 + k * beat
    if at < DUR - 2:
        mu.add(musicbox(midi(m)), at, .07, pan=rng.uniform(-.3, .3))
chords = [(.6, [41, 53, 57, 60]), (.6 + 4 * beat, [45, 52, 57, 60]), (.6 + 8 * beat, [46, 53, 58, 62]),
          (7.2, [48, 55, 60, 64, 67]), (10.0, [46, 53, 57, 62]), (12.6, [41, 48, 57, 60, 64, 67])]
for i, (at, notes) in enumerate(chords):
    end = chords[i + 1][0] if i + 1 < len(chords) else DUR
    for j, m in enumerate(notes):
        mu.add(pad(midi(m), end - at + 1.2, 900 if at < 7 else 1300), at, .025 if at < 7 else .035, pan=(j / (len(notes) - 1) - .5) * .8)
    mu.add(piano(midi(notes[0] + 12), 3.5), at, .08)
for k, m in enumerate((72, 77, 81, 84, 89)):            # rising arpeggio into the hug
    mu.add(piano(midi(m), 3.0, .7), 6.9 + k * .09, .06)
for k, m in enumerate((65, 72, 76, 79, 84)):            # final chord on the end card
    mu.add(piano(midi(m), 4.0, .7), 12.6 + k * .12, .07)
mu.reverb(.55, 3.2, 3200, 2.0)
fade = curve([(0, 0), (.5, 1), (DUR - 2.2, 1), (DUR, 0)])
mu.L *= fade
mu.R *= fade


def write(track, name, peak_db):
    st = np.stack([track.L, track.R], axis=1)
    st = np.tanh(st * 1.1) / 1.1
    st *= 10 ** (peak_db / 20) / np.max(np.abs(st))
    os.makedirs(os.path.join(HERE, "audio"), exist_ok=True)
    with wave.open(os.path.join(HERE, "audio", name), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((st * 32767).astype("<i2").tobytes())
    print("wrote", name)


write(fx, "sfx.wav", -1.0)
write(mu, "music.wav", -3.0)
