"""HO-047: the eight Russian Roster Roulette cues (+ handUp, roomTone), synthesised in-house with numpy.
No samples, no third-party recordings: every sound is built from noise, damped resonances and a synthetic room.
Writes 44.1 kHz mono 16-bit WAVs to ./wav; copy them to visual-assets/v10_1/roulette/assets/sfx/ (room_tone resampled to 22.05 kHz)."""
import numpy as np, wave, os, sys

SR = 44100
rng = np.random.default_rng(1747)
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "wav")
os.makedirs(OUT, exist_ok=True)

def t_(dur): return np.arange(int(dur * SR)) / SR
def noise(dur): return rng.standard_normal(int(dur * SR))

def biquad(x, kind, f, q=0.707):
    """RBJ cookbook biquad (lowpass/highpass/bandpass), direct form I, per-sample loop (sounds are short)."""
    w = 2 * np.pi * f / SR; a = np.sin(w) / (2 * q); c = np.cos(w)
    if kind == "lp": b = [(1 - c) / 2, 1 - c, (1 - c) / 2]
    elif kind == "hp": b = [(1 + c) / 2, -(1 + c), (1 + c) / 2]
    else: b = [a, 0, -a]
    A = [1 + a, -2 * c, 1 - a]
    b = [v / A[0] for v in b]; a1, a2 = A[1] / A[0], A[2] / A[0]
    y = np.zeros_like(x); x1 = x2 = y1 = y2 = 0.0
    for i, xi in enumerate(x):
        yi = b[0] * xi + b[1] * x1 + b[2] * x2 - a1 * y1 - a2 * y2
        x2, x1, y2, y1 = x1, xi, y1, yi; y[i] = yi
    return y

def fft_filter(x, lo=None, hi=None):
    """Zero-phase brick-ish band filter with soft edges, fast for long signals."""
    N = 2 * len(x)  # zero-padded so the filter never wraps the end of a sound onto its start
    X = np.fft.rfft(x, N); f = np.fft.rfftfreq(N, 1 / SR); g = np.ones_like(f)
    if lo: g *= 1 / (1 + (lo / np.maximum(f, 1)) ** 4)
    if hi: g *= 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * g, N)[: len(x)]

def modes(dur, freqs, decays, amps):
    """Damped sinusoids: the ring of small steel parts."""
    t = t_(dur); y = np.zeros_like(t)
    for f, d, a in zip(freqs, decays, amps):
        y += a * np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) * np.exp(-t / d)
    return y

def place(dst, src, at):
    i = int(at * SR); n = min(len(src), len(dst) - i)
    if n > 0: dst[i:i + n] += src[:n]
    return dst

def room_ir(dur, rt60, bright=6000, pre=0.012):
    """Synthetic room: early reflections + exponentially decaying filtered noise (marble = bright, hard)."""
    n = int(dur * SR); ir = np.zeros(n)
    for k in range(14):  # early reflections off counter, floor, walls
        place(ir, np.array([rng.uniform(0.25, 0.6) * (-1) ** k]), pre + rng.uniform(0, 0.06))
    tail = noise(dur) * np.exp(-6.91 * t_(dur) / rt60)
    tail = fft_filter(tail, lo=120, hi=bright)
    tail[: int(pre * SR)] = 0
    return ir + 0.35 * tail / np.max(np.abs(tail))

def convolve(x, ir):
    n = len(x) + len(ir) - 1; N = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, N) * np.fft.rfft(ir, N), N)[:n]

def finish(name, y, peak_db=-1.0, fade_out=0.01, trim=True):
    y = np.asarray(y, float)
    if trim:  # the cue must land on the frame: drop anything below -60 dB before the onset
        idx = np.argmax(np.abs(y) > np.max(np.abs(y)) * 1e-3); y = y[idx:]
    nf = int(fade_out * SR)
    if nf: y[-nf:] *= np.linspace(1, 0, nf)
    y = y / np.max(np.abs(y)) * 10 ** (peak_db / 20)
    with wave.open(os.path.join(OUT, name + ".wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
    print(f"{name:10s} {len(y)/SR:5.2f}s")

def tick(f0=1.0, bright=1.0, dur=0.035):
    """One ratchet tick: 1 ms broadband impulse into three short steel modes; 20-40 ms, no tail."""
    imp = noise(0.0015) * np.hanning(int(0.0015 * SR)); imp = biquad(imp, "hp", 1800)
    y = np.zeros(int(dur * SR)); place(y, imp * 0.8 * bright, 0)
    y += modes(dur, [3150 * f0, 5230 * f0, 7810 * f0], [0.0045, 0.003, 0.002], [0.5, 0.35, 0.25 * bright])
    y += 0.25 * modes(dur, [980 * f0], [0.004], [1])
    return y * np.exp(-t_(dur) / 0.009)

# ---------- click: one clean ratchet tick ----------
finish("click", tick(), fade_out=0.004)

# ---------- dry: hammer falls on an empty chamber ----------
y = np.zeros(int(0.16 * SR))
place(y, biquad(noise(0.004) * np.hanning(int(0.004 * SR)), "bp", 3200, 1.2) * 1.2, 0)
place(y, modes(0.15, [2140, 3390, 4720, 6050], [0.02, 0.014, 0.01, 0.007], [0.6, 0.5, 0.35, 0.2]), 0)
place(y, modes(0.08, [185, 410], [0.015, 0.01], [0.5, 0.3]), 0.0005)
place(y, 0.35 * tick(1.12, 0.6, 0.03), 0.018)  # the trigger's own small rebound
finish("dry", y * np.exp(-t_(0.16) / 0.04), fade_out=0.02)

# ---------- cock: single-action hammer, four clicks (C-O-L-T), ~0.4 s ----------
y = np.zeros(int(0.45 * SR))
for at, f, g in [(0.0, 0.92, 0.55), (0.105, 1.0, 0.6), (0.215, 1.08, 0.7), (0.33, 0.86, 1.0)]:
    c = tick(f, 1.0, 0.06) * g
    c += g * 0.5 * modes(0.06, [1650 * f, 2480 * f], [0.012, 0.008], [0.6, 0.4])
    place(y, c, at)
place(y, 0.12 * biquad(noise(0.33), "bp", 2200, 0.8) * np.exp(-t_(0.33) / 0.2), 0.0)  # spring/metal scrape under the clicks
finish("cock", y, fade_out=0.03)

# ---------- felt: steel rubbing green baize ----------
d = 0.55; y = fft_filter(noise(d), lo=260, hi=1700)
env = np.sin(np.pi * np.clip(t_(d) / d, 0, 1)) ** 1.5
grain = 1 + 0.35 * fft_filter(noise(d), hi=30)  # uneven pile of the cloth
finish("felt", y * env * grain, fade_out=0.02, trim=False)

# ---------- spinStart: revolver spun on felt, whirr slowing over ~2.5 s ----------
d = 2.6; t = t_(d)
rate = 11.0 * np.exp(-t / 1.05) + 1.2               # rotations per second, slowing
phase = 2 * np.pi * np.cumsum(rate) / SR
am = 0.55 + 0.45 * np.cos(phase) ** 2               # the frame's weight rocking twice per turn
whirr = fft_filter(noise(d), lo=380, hi=2600) * am
rub = fft_filter(noise(d), lo=150, hi=900) * 0.6
env = np.exp(-t / 1.0) * np.clip(t / 0.012, 0, 1)
y = (whirr + rub) * env
place(y, 0.9 * modes(0.12, [1240, 2310, 3570], [0.03, 0.02, 0.012], [0.5, 0.4, 0.25]), 0.0)  # the flick that starts it
finish("spinStart", y, fade_out=0.15)

# ---------- heart: three slow beats, low and felt ----------
d = 1.6; y = np.zeros(int(d * SR))
def beat(gain):
    b = np.zeros(int(0.42 * SR))
    for at, f0, g in [(0.0, 64, 1.0), (0.17, 56, 0.7)]:  # lub, dub
        tt = t_(0.24); f = f0 * (1 + 0.5 * np.exp(-tt / 0.02))
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.07) * np.clip(tt / 0.006, 0, 1)
        s += 0.15 * fft_filter(noise(0.24), lo=40, hi=160) * np.exp(-tt / 0.04)
        place(b, s * g, at)
    return b * gain
for i, at in enumerate([0.0, 0.52, 1.04]): place(y, beat(1.0 - 0.06 * i), at)
finish("heart", np.tanh(y * 1.6), fade_out=0.08)

# ---------- bang: the hero shot, crack + thump + marble cafe echo (< 2 s) ----------
d = 0.35; t = t_(d); dry_ = np.zeros(int(d * SR))
crack = biquad(noise(0.004), "hp", 2500) * np.exp(-t_(0.004) / 0.0012); place(dry_, crack * 2.2, 0)
blast = fft_filter(noise(d), hi=4500) * np.exp(-t / 0.035); place(dry_, blast * 1.4, 0.0005)
f = 115 * np.exp(-t / 0.05) + 42
thump = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.11) * np.clip(t / 0.002, 0, 1); place(dry_, thump * 1.3, 0)
place(dry_, 0.35 * modes(0.2, [1830, 2950, 4420], [0.05, 0.035, 0.02], [0.4, 0.3, 0.2]), 0.002)  # the frame rings
dry_ = np.tanh(dry_ * 1.4)
wet = convolve(dry_, room_ir(1.4, 1.25, bright=5500))
y = np.zeros(int(1.85 * SR)); place(y, dry_, 0)
wet = wet[: len(y)] if len(wet) >= len(y) else np.pad(wet, (0, len(y) - len(wet)))
y += 0.42 * wet / np.max(np.abs(wet)) * np.max(np.abs(dry_))
y *= np.clip((1.85 - t_(1.85)) / 0.35, 0, 1) ** 1.5  # land inside 2 s
finish("bang", y, fade_out=0.05)

# ---------- splinter: bullet into the wooden squad board 2 m away, wood crack + splinters + paper ----------
d = 0.7; y = np.zeros(int(d * SR))
hit = fft_filter(noise(0.03), lo=300, hi=6000) * np.exp(-t_(0.03) / 0.006); place(y, hit * 1.4, 0)
place(y, modes(0.25, [520, 910, 1460, 2280], [0.05, 0.035, 0.02, 0.012], [0.55, 0.45, 0.35, 0.2]), 0.0)  # board body knock
for k in range(26):  # splinters: decaying cloud of small wood cracks
    at = abs(rng.normal(0.0, 0.11)); g = np.exp(-at / 0.12) * rng.uniform(0.25, 0.8)
    f0 = rng.uniform(1200, 4200)
    place(y, g * biquad(noise(0.012), "bp", f0, 3.0) * np.exp(-t_(0.012) / 0.003), 0.004 + at)
paper = fft_filter(noise(0.22), lo=2500, hi=9000) * (0.4 + 0.6 * np.abs(fft_filter(noise(0.22), hi=60)))
place(y, 0.35 * paper * np.exp(-t_(0.22) / 0.09), 0.015)
y += 0.18 * convolve(y, room_ir(0.6, 0.5, bright=5000))[: len(y)]
finish("splinter", y, fade_out=0.06)

# ---------- handUp (extra): leather glove creak + cloth as the hand rises ----------
d = 0.9; t = t_(d); y = np.zeros(int(d * SR))
pos = 0.0
while pos < 0.75:  # stick-slip pulses at an uneven 35-90 Hz
    g = np.sin(np.pi * pos / 0.75) ** 0.8
    place(y, g * biquad(noise(0.006), "bp", rng.uniform(700, 1400), 4.0) * np.exp(-t_(0.006) / 0.002), 0.05 + pos)
    pos += 1 / rng.uniform(35, 90)
cloth = fft_filter(noise(d), lo=900, hi=6000) * np.sin(np.pi * t / d) ** 2 * (0.5 + 0.5 * np.abs(fft_filter(noise(d), hi=12)))
finish("handUp", y + 0.25 * cloth / np.max(np.abs(cloth)) * np.max(np.abs(y)), fade_out=0.08, trim=False)

# ---------- roomTone (extra): 24 s seamless loop, quiet cafe, lamp hiss, far street, no music ----------
d = 24.0; n = int(d * SR); xf = int(1.0 * SR)
def loopable(x):  # crossfade the extra second onto the start so the loop has no seam
    a = x[:n].copy(); a[:xf] = a[:xf] * np.linspace(0, 1, xf) + x[n:n + xf] * np.linspace(1, 0, xf); return a
L = d + 1.0
air = fft_filter(noise(L), lo=60, hi=700) * 0.5
hiss = fft_filter(noise(L), lo=4000, hi=11000) * 0.05
street = fft_filter(noise(L), lo=80, hi=400) * (0.5 + 0.5 * np.sin(2 * np.pi * t_(L) / 9.0 + 1.0) ** 2) * 0.35
y = air + hiss + street
for k in range(5):  # far-off cup and spoon, once every few seconds, very soft
    at = rng.uniform(1.5, d - 1.5); f0 = rng.uniform(2600, 3600)
    place(y, 0.06 * modes(0.4, [f0, f0 * 2.71], [0.12, 0.06], [1, 0.4]), at)
y = loopable(y)
finish("roomTone", y, peak_db=-12.0, fade_out=0, trim=False)
