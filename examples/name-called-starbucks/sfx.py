"""Synthesizes the sound design for "الاسم اللي بيتنادى", synced to the GSAP timeline in index.html.

Writes audio/sfx.wav (café ambience + effects) and audio/music.wav (felt piano + pads).
Usage: python3 sfx.py   (needs numpy + scipy)
"""
import os
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
DUR = 45.2
N = int(SR * DUR)
rng = np.random.default_rng(21)
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
    y = np.zeros_like(x)
    n = len(x)
    for i in range(0, n, block):
        c = f0 * (f1 / f0) ** (i / n)
        lo, hi = max(c * (1 - q), 30), min(c * (1 + q), SR / 2 - 100)
        seg = x[max(0, i - 2048):i + block]
        y[i:i + block] = bp(seg, lo, hi)[-len(x[i:i + block]):]
    return y


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def curve(points):
    """Piecewise-linear automation over the whole film: [(time, value), ...]."""
    ts, vs = zip(*points)
    return np.interp(np.arange(N) / SR, ts, vs)


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

    def reverb(self, wet=0.3, length=2.4, damp=4000, decay=3.0):
        t = t_(length)
        out = []
        for ch in (self.L, self.R):
            ir = lp(rng.standard_normal(len(t)), damp) * np.exp(-t * decay)
            ir /= np.sqrt(np.sum(ir ** 2))
            out.append(ch + wet * fftconvolve(ch, ir)[:N])
        self.L, self.R = out

    def gain(self, g):
        self.L *= g
        self.R *= g


# ---------------------------------------------------------------- sound kits
def whoosh(d=1.0, f0=400, f1=3000, peak=0.6):
    t = t_(d)
    x = sweep_bp(rng.standard_normal(len(t)), f0, f1)
    p = t / d
    e = np.where(p < peak, (p / peak) ** 2, ((1 - p) / (1 - peak)) ** 1.5)
    return x * e * 2.2


def bell(freq, d=2.5, bright=1.0):
    t = t_(d)
    s = np.zeros(len(t))
    for ratio, amp, dec in ((1, 1, 1.0), (2.0, .5 * bright, 1.6), (3.01, .25 * bright, 2.4), (4.2, .12 * bright, 3.5)):
        s += amp * np.sin(2 * np.pi * freq * ratio * t) * np.exp(-t * dec * 4.4 / d)
    return s * np.minimum(t / 0.003, 1) * 0.5


def counter_bell(pitch=1.0):
    """Hotel-style service bell — the barista's call."""
    t = t_(2.8)
    f = 2350 * pitch
    s = sum(a * np.sin(2 * np.pi * f * r * t + ph) * np.exp(-t * dcy)
            for r, a, dcy, ph in ((1, 1, 1.6, 0), (1.003, .8, 1.7, 1), (2.76, .35, 3.5, 0), (5.4, .15, 7, 0)))
    click = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 600) * .5
    return (s * 0.4 + click) * np.minimum(t / 0.001, 1)


def marker(d):
    """Felt-tip squeak on paper: band-passed noise with stroke rhythm."""
    t = t_(d)
    x = bp(rng.standard_normal(len(t)), 1800, 6500)
    strokes = np.abs(np.sin(2 * np.pi * rng.uniform(5.5, 7.5) * t + rng.uniform(0, 3))) ** 1.5
    jitter = 0.6 + 0.4 * lp(rng.standard_normal(len(t)), 30) * 6
    e = np.minimum(t / 0.03, 1) * np.minimum((d - t) / 0.05, 1).clip(0)
    squeak = np.sin(2 * np.pi * np.cumsum(2600 + 500 * np.sin(2 * np.pi * 3 * t)) / SR) * 0.05
    return (x * strokes * jitter + squeak * strokes) * e * 0.8


def slide(d=0.5):
    """Paper cup sliding across the counter."""
    t = t_(d)
    x = bp(rng.standard_normal(len(t)), 300, 2500)
    e = np.sin(np.pi * t / d) ** 1.2
    return x * e * 0.9 + whoosh(d, 1200, 500, .4) * 0.3


def lift(d=0.6):
    t = t_(d)
    tap = lp(rng.standard_normal(len(t)), 900) * np.exp(-t * 60) * 0.8
    return tap + whoosh(d, 500, 2600, .7) * 0.6


def clock_tick():
    t = t_(0.08)
    return (np.sin(2 * np.pi * 1900 * t) * np.exp(-t * 120) + hp(rng.standard_normal(len(t)), 3500) * np.exp(-t * 400) * .6)


def heartbeat():
    def thump(f, g):
        t = t_(0.3)
        return np.sin(2 * np.pi * f * t) * np.exp(-t * 18) * np.minimum(t / 0.004, 1) * g
    s = np.zeros(int(SR * 0.7))
    a, b = thump(55, 1.0), thump(48, 0.7)
    s[:len(a)] += a
    j = int(0.2 * SR)
    s[j:j + len(b)] += b
    return lp(s, 180)


def pop(freq=500):
    t = t_(0.12)
    f = freq * (1 + 1.4 * (1 - np.exp(-t * 80)))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45) * np.minimum(t / 0.002, 1)


def tape_rewind(d):
    """Cassette fast-rewind: warbling high squeal + motor hiss + clicks."""
    t = t_(d)
    f = 2600 + 900 * np.sin(2 * np.pi * 7 * t) + 600 * lp(rng.standard_normal(len(t)), 8) * 20 + 800 * t / d
    squeal = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.12
    hiss = bp(rng.standard_normal(len(t)), 2000, 9000) * 0.35
    motor = np.sin(2 * np.pi * 120 * t) * 0.1 + lp(rng.standard_normal(len(t)), 400) * 0.3
    clicks = np.zeros(len(t))
    for k in np.arange(0, d, 0.22):
        i = int(k * SR)
        c = hp(rng.standard_normal(600), 2000) * np.exp(-np.arange(600) / 60)
        clicks[i:i + 600] += c[:len(clicks[i:i + 600])] * 0.5
    e = np.minimum(t / 0.1, 1) * np.minimum((d - t) / 0.05, 1).clip(0)
    return (squeal + hiss + motor + clicks) * e


def tape_stop(d=0.5):
    t = t_(d)
    f = 1400 * (1 - t / d) ** 2 + 40
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 - t / d) * 0.3 + lp(rng.standard_normal(len(t)), 300) * np.exp(-t * 10) * .5


def notif_ping():
    s = np.zeros(int(SR * 1.6))
    for k, m in enumerate((88, 95)):
        b = bell(midi(m), 1.2, .3)
        i = int(k * 0.13 * SR)
        s[i:i + len(b)] += b
    return s


def sub_boom(f0=62, f1=38, d=1.2):
    t = t_(d)
    f = f1 + (f0 - f1) * np.exp(-t * 6)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.5) * np.minimum(t / 0.005, 1)
    return s + lp(rng.standard_normal(len(t)), 180) * np.exp(-t * 8) * 0.4


def riser(d=1.2):
    t = t_(d)
    x = sweep_bp(rng.standard_normal(len(t)), 300, 6000, q=0.5)
    tone = np.sin(2 * np.pi * np.cumsum(200 * (8 ** (t / d))) / SR) * 0.15
    return (x * 1.6 + tone) * (t / d) ** 2.2


def sparkle(d=0.9, n=12):
    s = np.zeros(int(SR * (d + 0.6)))
    for k in range(n):
        b = bell(midi(rng.choice([84, 86, 88, 91, 93, 96])), 0.5, 0.3) * 0.25
        i = int(SR * d * k / n)
        s[i:i + len(b)] += b
    return s


# ---------------------------------------------------------------- café ambience bed
amb = Track()
room = lp(rng.standard_normal(N), 1500) * 0.05
murmur = np.zeros(N)
for v in range(7):  # a few distant voices: formant-filtered noise with syllable rhythm
    lo = rng.uniform(250, 500)
    voice = bp(rng.standard_normal(N), lo, lo * rng.uniform(2.2, 3.2))
    syll = np.clip(lp(rng.standard_normal(N), rng.uniform(3, 6)) * 14, 0, 1)
    phrase = np.clip(lp(rng.standard_normal(N), 0.4) * 20 + .3, 0, 1)
    murmur += voice * syll * phrase * 0.11
amb.L += room + murmur
amb.R += np.roll(room, 911) + np.roll(murmur, 4800)
for at in np.arange(0.4, DUR, 1.0) + rng.uniform(0, .9, int(DUR)):  # cups, spoons, saucers
    amb.add(bell(rng.uniform(2800, 5200), .35, .5), at, rng.uniform(.02, .06), pan=rng.uniform(-.8, .8))
for at, d in ((0.6, 1.6), (6.0, 1.2), (27.5, 1.4), (33.0, 1.2)):  # espresso steam wand
    hiss = hp(rng.standard_normal(int(SR * d)), 2500) * np.sin(np.pi * t_(d) / d) ** .5
    amb.add(hiss, at, 0.05, pan=-.6)
amb.reverb(0.25, 1.6, 3000)
amb_vol = curve([(0, 0), (1.2, 1), (12.2, 1), (15.6, .06), (17.2, .04), (17.6, 0), (26.2, 0),
                 (26.5, .7), (36.2, .7), (37.2, 1), (38.8, .8), (39.8, 0), (DUR, 0)])
amb_lp = curve([(0, 1), (12.2, 1), (15.6, 0), (26.2, 0), (26.6, 1), (DUR, 1)])
dull = lp(amb.L, 500), lp(amb.R, 500)  # muffled version for the silence
amb.L = (amb.L * amb_lp + dull[0] * (1 - amb_lp)) * amb_vol
amb.R = (amb.R * amb_lp + dull[1] * (1 - amb_lp)) * amb_vol

# ---------------------------------------------------------------- effects timeline (seconds match index.html)
fx = Track()
for at, d in ((1.2, 1.4), (4.85, .8), (7.05, .45), (8.45, .3), (10.1, 1.5), (32.6, 1.2), (34.6, 1.0)):
    fx.add(marker(d), at, 0.5, pan=-.15)
fx.add(marker(.6), 33.9, 0.4, pan=-.3)                       # pink ribbon doodle
for at in (2.9, 5.8, 7.55, 8.75):
    fx.add(counter_bell(), at, 0.45, pan=.25)
for at, d in ((4.3, .5), (6.78, .35), (8.22, .3), (9.3, 1.1), (31.7, .8)):
    fx.add(slide(d), at, 0.35)
for at, d in ((3.7, .55), (6.3, .45), (7.85, .35), (8.95, .3), (31.0, .6), (36.6, .7)):
    fx.add(lift(d), at, 0.45, pan=.3)

# silence: the call nobody answers
fx.add(counter_bell(), 11.9, 0.55, pan=.25)
fx.add(counter_bell(0.94), 13.3, 0.3, pan=.25)
for at in (14.0, 14.6, 15.2, 15.8):
    fx.add(clock_tick(), at, 0.22)
for at in (14.4, 15.5, 16.6):
    fx.add(heartbeat(), at, 0.4)

# one in eight
fx.add(whoosh(1.6, 2500, 300, .5), 17.4, 0.3)
for k in range(15):
    fx.add(pop(rng.uniform(420, 700)), 18.0 + abs(k - 7) * 0.05, 0.22, pan=rng.uniform(-.7, .7))
fx.add(whoosh(1.4, 3000, 200, .9)[::-1] * .8, 19.6, 0.3)       # reverse swell as cups fade

# rewind
fx.add(tape_rewind(3.4), 22.8, 0.6)
fx.add(tape_stop(), 26.15, 0.7)
fx.add(sub_boom(80, 40, .8), 26.25, 0.5)

# the reminder
fx.add(notif_ping(), 26.75, 0.55)
fx.add(whoosh(.7, 600, 2500, .5), 28.4, 0.25)
for at in (29.0, 29.45, 29.9):
    fx.add(pop(900), at, 0.25)
    fx.add(bell(midi(91), .6, .2), at + .05, 0.12)

# the return
fx.add(sparkle(.6, 6), 33.9, 0.4)
fx.add(pop(700), 35.65, 0.35)
fx.add(bell(midi(84), 1.6), 35.7, 0.2)
fx.add(counter_bell(), 36.0, 0.5, pan=.25)

# end card
fx.add(riser(1.3), 37.6, 0.45)
fx.add(whoosh(1.2, 300, 3000, .6), 38.9, 0.35)
fx.add(sub_boom(70, 35, 2.0), 39.6, 0.9)
fx.add(bell(midi(72), 4.0), 39.6, 0.25, pan=-.2)
fx.add(bell(midi(76), 4.0), 39.6, 0.2, pan=.2)
fx.add(sparkle(0.9), 40.7, 0.6)
fx.add(pop(900), 40.9, 0.35)
fx.reverb(0.3)
fx.L += amb.L
fx.R += amb.R

# ---------------------------------------------------------------- music: felt piano + pads (70 BPM)
mu = Track()


def piano(f, d=2.4, vel=1.0):
    t = t_(d)
    s = (np.sin(2 * np.pi * f * t) + .35 * np.sin(4 * np.pi * f * t) * np.exp(-t * 3)
         + .12 * np.sin(6 * np.pi * f * t) * np.exp(-t * 6) + .05 * np.sin(8 * np.pi * f * t) * np.exp(-t * 9))
    hammer = lp(rng.standard_normal(len(t)), 1200) * np.exp(-t * 90) * .15
    return lp((s * np.exp(-t * 1.6) + hammer) * np.minimum(t / 0.008, 1), 2200 + 800 * vel) * vel


def pad_note(f, d, cutoff=900):
    t = t_(d)
    s = sum(2 * ((t * f * (1 + det)) % 1) - 1 for det in (-0.005, 0, 0.005))
    e = np.minimum(t / 1.2, 1) * np.minimum((d - t) / 1.2, 1).clip(0)
    return lp(s, cutoff, 2) * e


beat = 60 / 70
motif = [0, 2, 4, 2, 1, 2, 3, 2]  # index into the chord's upper tones


def play(chords, start, gain, pad_gain, step=beat / 2, cutoff=900):
    at = start
    for notes, beats in chords:
        d = beats * beat
        for k, m in enumerate(notes):
            mu.add(pad_note(midi(m), d + 1.2, cutoff), at, pad_gain, pan=(k / max(len(notes) - 1, 1) - .5) * .8)
        upper = [n + 12 for n in notes[1:]] + [notes[1] + 24]
        k = 0
        while k * step < d - 0.05:
            m = upper[motif[k % len(motif)] % len(upper)]
            mu.add(piano(midi(m), vel=0.9 if k % 4 == 0 else 0.6), at + k * step, gain, pan=rng.uniform(-.3, .3))
            k += 1
        mu.add(piano(midi(notes[0]), 3.5, .8), at, gain * 0.9)
        at += d


# A — routine (warm, C major), cut dead at the unanswered call
play([([48, 55, 60, 64], 4), ([45, 52, 57, 60], 4), ([41, 48, 53, 57], 4), ([43, 50, 55, 59], 2)], 0.8, 0.07, 0.02)
cut = curve([(0, 1), (11.85, 1), (11.95, 0), (DUR, 0)])
mu.L *= cut
mu.R *= cut
# B — one in eight: dark drone, single low notes
for m in (33, 40, 45):
    mu.add(pad_note(midi(m), 5.8, 500), 17.2, 0.022)
for k, m in enumerate((69, 72, 71, 69)):
    mu.add(piano(midi(m), 3.0, .5), 17.8 + k * 1.2, 0.05)
# C — hope returns after the rewind, builds to the end card
play([([41, 48, 53, 57], 4), ([48, 55, 60, 64], 4), ([43, 50, 55, 59], 4), ([45, 52, 57, 60], 4),
      ([41, 48, 53, 57, 60], 4)], 26.3, 0.075, 0.03, cutoff=1100)
# D — resolve on the logo
for k, m in enumerate((36, 43, 52, 55, 60, 62, 64)):
    mu.add(pad_note(midi(m), 5.6, 1300), 39.6, 0.04, pan=(k / 6 - .5) * .9)
for k, m in enumerate((72, 76, 79, 84)):
    mu.add(piano(midi(m), 4.0, .8), 39.6 + k * 0.18, 0.08)
mu.reverb(0.55, 3.2, 3200, 2.2)
fade = curve([(0, 0), (0.6, 1), (DUR - 2.5, 1), (DUR, 0)])
mu.L *= fade
mu.R *= fade


# ---------------------------------------------------------------- write
def write(track, name, peak_db=-1.0):
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


write(fx, "sfx.wav")
write(mu, "music.wav", -3.0)
