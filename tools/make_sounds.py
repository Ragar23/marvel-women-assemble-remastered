"""Generates the game's sound effects as small mono WAVs.
The project ships no sfx library, so these are synthesised.
Run with: python3 tools/make_sounds.py"""
import math, random, struct, wave, os

RATE = 22050
random.seed(7)

def write(name, samples):
    peak = max(1e-9, max(abs(s) for s in samples))
    frames = b"".join(
        struct.pack("<h", int(max(-1, min(1, s / peak * 0.85)) * 32767)) for s in samples
    )
    path = os.path.join("assets", name)
    with wave.open(path, "w") as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(RATE)
        f.writeframes(frames)
    print(f"{name:<16} {len(samples)/RATE:.2f}s  {os.path.getsize(path)//1024}KB")

def env(i, n, attack=0.01, curve=3.0):
    """Fast attack, exponential decay."""
    a = max(1, int(n * attack))
    return (i / a) if i < a else ((1 - (i - a) / (n - a)) ** curve)

def tone(f, i):  return math.sin(2 * math.pi * f * i / RATE)
def saw(f, i):   return 2 * ((f * i / RATE) % 1) - 1
def square(f, i):return 1 if (f * i / RATE) % 1 < 0.5 else -1

# ---- shoot: a short downward zap ----
n = int(RATE * 0.11)
write("sfx-shoot.wav", [
    (0.6 * square(900 - 620 * i / n, i) + 0.4 * tone(1800 - 1200 * i / n, i)) * env(i, n, 0.004, 4)
    for i in range(n)])

# ---- hit: a dry tick, for damage that does not kill ----
n = int(RATE * 0.07)
write("sfx-hit.wav", [
    (0.5 * random.uniform(-1, 1) + 0.5 * tone(1400, i)) * env(i, n, 0.002, 6)
    for i in range(n)])

# ---- explosion: noise over a falling rumble ----
n = int(RATE * 0.40)
low = 0.0
out = []
for i in range(n):
    noise = random.uniform(-1, 1)
    low += (noise - low) * 0.06                     # one-pole low pass
    out.append((0.7 * low + 0.3 * noise * 0.4 + 0.5 * tone(90 - 55 * i / n, i)) * env(i, n, 0.005, 2.4))
write("sfx-explode.wav", out)

# ---- pickup: three rising steps ----
n = int(RATE * 0.26)
steps = [660, 880, 1320]
write("sfx-pickup.wav", [
    tone(steps[min(len(steps) - 1, int(i / n * len(steps)))], i) * env(i, n, 0.01, 1.6)
    for i in range(n)])

# ---- hurt: a falling buzz ----
n = int(RATE * 0.34)
write("sfx-hurt.wav", [
    (0.7 * saw(340 - 250 * i / n, i) + 0.3 * square(170 - 120 * i / n, i)) * env(i, n, 0.006, 2.2)
    for i in range(n)])

# ---- ultimate: a rising sweep that blooms into noise ----
n = int(RATE * 0.75)
out = []
for i in range(n):
    t = i / n
    swell = 0.6 * saw(180 + 900 * t * t, i) + 0.4 * tone(360 + 1500 * t * t, i)
    out.append((swell + random.uniform(-1, 1) * 0.35 * t) * (env(i, n, 0.25, 1.4)))
write("sfx-ultimate.wav", out)

# ---- thunder: Thor's God Blast, a crackle over a boom ----
n = int(RATE * 0.6)
low = 0.0
out = []
for i in range(n):
    noise = random.uniform(-1, 1)
    low += (noise - low) * 0.03
    crack = noise if random.random() < 0.35 else 0.0
    out.append((0.8 * low + 0.5 * crack * (1 - i / n) + 0.4 * tone(70, i)) * env(i, n, 0.002, 2.0))
write("sfx-thunder.wav", out)

# ---- hammer: a metallic clang for Mjolnir ----
n = int(RATE * 0.35)
partials = [520, 913, 1370, 2100, 2760]   # inharmonic, so it rings like metal
write("sfx-hammer.wav", [
    sum(tone(f, i) / (k + 1.5) for k, f in enumerate(partials)) * env(i, n, 0.002, 3.2)
    for i in range(n)])

# ---- wave clear: a bright major triad ----
n = int(RATE * 0.55)
write("sfx-wave.wav", [
    (tone(523, i) + tone(659, i) + tone(784, i)) / 3 * env(i, n, 0.02, 1.5)
    for i in range(n)])
