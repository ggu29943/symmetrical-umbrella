#!/usr/bin/env python3
"""
《闪电》配乐 —— 全部由代码合成（无采样、无外部素材）。
读取 build/timeline.json（场景起止 + 每一道闪电的时刻），生成与画面逐帧对齐的配乐：
  · 和声铺底（失谐锯齿波 + 低通）、低频持续音、琶音拨弦、钟声、轻鼓
  · 每一道闪电对应的冲击音 / 雷声（远处的闪电则只有滞后的闷雷，热闪电完全无声）
输出 build/music.wav（48 kHz 立体声）
"""
import json, sys
import numpy as np
import scipy.signal as sg

SR = 48000
TL = json.load(open('build/timeline.json'))
DUR = TL['duration']
N = int(SR * DUR) + SR * 6
SC = {s['name']: s for s in TL['scenes']}
rng = np.random.default_rng(20261105)

mus = np.zeros((2, N))   # 音乐总线（送混响）
fx = np.zeros((2, N))    # 音效总线（较短混响）
dry = np.zeros((2, N))   # 不加混响的细节（滴答声等）

def midi(m): return 440.0 * 2 ** ((m - 69) / 12)
def sos_lp(fc, order=2): return sg.butter(order, fc, 'low', fs=SR, output='sos')
def sos_hp(fc, order=2): return sg.butter(order, fc, 'high', fs=SR, output='sos')
def sos_bp(lo, hi, order=2): return sg.butter(order, [lo, hi], 'band', fs=SR, output='sos')
def place(bus, t0, sig, gain=1.0, pan=0.0):
    i0 = int(t0 * SR)
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.stack([sig * l * 1.414, sig * r * 1.414])
    n = min(sig.shape[1], N - i0)
    if n <= 0 or i0 < 0: return
    bus[:, i0:i0 + n] += sig[:, :n] * gain
def smoothstep(x): x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)
def env_ar(n, att, rel_start, rel):
    t = np.arange(n) / SR
    return smoothstep(t / max(att, 1e-3)) * (1 - smoothstep((t - rel_start) / max(rel, 1e-3)))

# ───────── 乐器 ─────────
def pad(notes, t0, t1, amp=0.12, att=1.2, rel=1.8, fc=1400, fc2=None, bright_t=None, width=0.6, det=0.09):
    """失谐锯齿波和弦；fc2/bright_t：在 bright_t 秒内从 fc 渐亮到 fc2（两路滤波交叉淡化）"""
    n = int((t1 - t0 + rel) * SR); t = np.arange(n) / SR
    out = np.zeros((2, n))
    for ch in (0, 1):
        s = np.zeros(n)
        for m in notes:
            f = midi(m)
            for d in (-det, 0.0, det):
                ph = rng.random()
                fd = f * 2 ** ((d * (1 if ch else -1) * width) / 12)
                s += 2 * ((fd * t + ph) % 1.0) - 1
        s /= (len(notes) * 3) ** 0.75
        a = sg.sosfilt(sos_lp(fc), s)
        if fc2:
            b = sg.sosfilt(sos_lp(fc2), s)
            k = smoothstep(t / bright_t) if bright_t else 1.0
            a = a * (1 - k) + b * k
        out[ch] = sg.sosfilt(sos_hp(85, 1), a)
    out *= env_ar(n, att, t1 - t0, rel) * amp
    place(mus, t0, out)

def drone(m, t0, t1, amp=0.1, att=3, rel=3):
    amp *= 0.45; m = max(m, 38)
    n = int((t1 - t0 + rel) * SR); t = np.arange(n) / SR; f = midi(m)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t + 0.3) + 0.15 * np.sin(2 * np.pi * 3.01 * f * t)
    s *= 1 + 0.08 * np.sin(2 * np.pi * 0.11 * t)
    place(mus, t0, s * env_ar(n, att, t1 - t0, rel) * amp)

def pluck(f, amp=0.1, dur=1.1, bright=1.0, pan=0.0, t0=0.0, bus=None):
    n = int(dur * SR); t = np.arange(n) / SR
    idx = 2.2 * bright * np.exp(-t * 10)
    s = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * 2 * f * t)) * np.exp(-t * 4.2) * (1 - np.exp(-t * 900))
    s += 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 7)
    place(mus if bus is None else bus, t0, s * amp, pan=pan)

def bell(f, t0, amp=0.08, dur=3.0, pan=0.0):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.zeros(n)
    for r, a, d in ((1, 1, 1.6), (2.76, 0.5, 0.9), (5.4, 0.25, 0.5), (8.93, 0.12, 0.3)):
        s += a * np.sin(2 * np.pi * f * r * t + rng.random() * 6) * np.exp(-t / d)
    s *= (1 - np.exp(-t * 400))
    place(mus, t0, s * amp, pan=pan)

def kick(t0, amp=0.25):
    n = int(0.5 * SR); t = np.arange(n) / SR
    f = 45 + 80 * np.exp(-t * 28)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
    place(fx, t0, s * amp)

def arp(chords, t0, t1, step, amp=0.07, lo=62, hi=86, pattern=(0, 1, 2, 3, 2, 1), accent=(1, .6, .8, .6), bright=1.0, fade=1.0, dur=1.0, rise=0.0):
    """chords: [(开始时刻, 音符表)]；从和弦音中取 [lo,hi] 范围内的音按模式循环"""
    k = 0; t = t0
    while t < t1 - 0.02:
        cur = [c for c in chords if c[0] <= t + 1e-6]
        notes = cur[-1][1] if cur else chords[0][1]
        pool = sorted({m + 12 * o for m in notes for o in range(-2, 4) if lo <= m + 12 * o <= hi})
        if pool:
            m = pool[pattern[k % len(pattern)] % len(pool)]
            g = min(1, (t - t0) / fade, (t1 - t) / fade) if fade > 0 else 1
            g *= 1 + rise * (t - t0) / max(1e-3, t1 - t0)
            pluck(midi(m), amp * accent[k % len(accent)] * g, dur=dur, bright=bright, pan=0.35 * np.sin(k * 1.7), t0=t)
        k += 1; t += step

# ───────── 音效（与闪电同步） ─────────
def brown(n):
    w = rng.standard_normal(n); b = np.cumsum(w); b = sg.sosfilt(sos_hp(22), b); return b / (np.abs(b).max() + 1e-9)

def thunder(t0, s=1.0, crack=True, length=5.0, delay=0.0, sub=True, near=True):
    """近雷：中低频"撕裂声"（大量细碎冲击叠在一起）→ 厚重的"砰" → 起伏的滚雷长尾。
    刻意压低 3 kHz 以上的成分，避免"脆"的噼啪感。"""
    n = int(length * SR); t = np.arange(n) / SR
    out = np.zeros((2, n))
    for ch in (0, 1):
        # 滚雷：布朗噪声低通 + 多个随机起伏
        rum = sg.sosfilt(sos_hp(35), sg.sosfilt(sos_lp(420 if near else 230, 2), brown(n)))
        e = np.zeros(n)
        for _ in range(int(7 + 6 * s)):
            tk = delay + 0.05 + rng.random() ** 1.4 * length * 0.55
            e += rng.uniform(0.35, 1.0) * np.where(t > tk, np.exp(-(t - tk) / rng.uniform(0.35, 1.3)), 0) * smoothstep((t - tk) / 0.08)
        e *= np.exp(-t / (length * 0.5))
        r = rum * e; r /= np.abs(r).max() + 1e-9
        out[ch] = r * 1.0
        if crack:
            # 撕裂声：几十个 2–8 ms 的细碎噪声冲击，按指数分布散布在前 0.3 s
            rip = np.zeros(n)
            for _ in range(int(30 + 30 * s)):
                tt = delay + min(0.35, rng.exponential(0.07)); k = int(tt * SR); L = int(rng.uniform(0.002, 0.009) * SR)
                if k + L < n: rip[k:k + L] += rng.standard_normal(L) * np.hanning(L) * np.exp(-tt / 0.12) * rng.uniform(0.4, 1.0)
            rip = sg.sosfilt(sos_bp(160, 2400), rip); rip = sg.sosfilt(sos_lp(2800, 2), rip); rip /= np.abs(rip).max() + 1e-9
            # 主体"砰"：80–500 Hz
            body = sg.sosfilt(sos_bp(70, 500), rng.standard_normal(n)) * smoothstep((t - delay) / 0.005) * np.exp(-np.maximum(0, t - delay) / 0.3)
            body /= np.abs(body).max() + 1e-9
            out[ch] += rip * 0.5 + body * 0.62
    if sub:
        f = 38 + 34 * np.exp(-t * 5)
        boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-np.maximum(0, t - delay) / 0.9) * smoothstep((t - delay) / 0.01)
        # 小音箱也能听到的"低频谐波层"（90–180 Hz）
        thump = sg.sosfilt(sos_bp(90, 180), rng.standard_normal(n)) * np.exp(-np.maximum(0, t - delay) / 0.45) * smoothstep((t - delay) / 0.01)
        thump /= np.abs(thump).max() + 1e-9
        out += boom * 0.5 + thump * 0.45
    place(fx, t0, out * s * 0.4)

def soft_hit(t0, s=0.5):
    n = int(1.2 * SR); t = np.arange(n) / SR
    f = 40 + 40 * np.exp(-t * 10)
    s1 = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.5)
    s2 = sg.sosfilt(sos_bp(200, 1600), rng.standard_normal(n)) * np.exp(-t / 0.25) * smoothstep(t / 0.03) * 0.25
    place(fx, t0, (s1 + s2) * s * 0.35)

def tick(t0, s=0.1):
    n = int(0.06 * SR); t = np.arange(n) / SR
    place(dry, t0, np.sin(2 * np.pi * 2400 * t) * np.exp(-t / 0.006) * s * 0.9, pan=0.2)

def shimmer(t0, s=0.5, base=1760):
    for k, r in enumerate((1, 1.5, 2, 2.5, 3)):
        bell(base * r * (1 + 0.003 * rng.standard_normal()), t0 + k * 0.04, amp=0.035 * s, dur=2.6, pan=(k - 2) * 0.3)

def crackle(t0, s=0.15):
    for _ in range(8):
        tt = t0 + rng.random() * 0.5
        n = int(0.02 * SR); t = np.arange(n) / SR
        place(fx, tt, sg.sosfilt(sos_hp(2500), rng.standard_normal(n)) * np.exp(-t / 0.004) * s * rng.uniform(0.3, 1), pan=rng.uniform(-0.6, 0.6))

def pop(t0, s=0.4):
    n = int(0.4 * SR); t = np.arange(n) / SR
    place(fx, t0, (np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.05) + sg.sosfilt(sos_bp(1000, 5000), rng.standard_normal(n)) * np.exp(-t / 0.01) * 0.5) * s * 0.5)

def noise_bed(t0, t1, lo, hi, amp, att=2, rel=2):
    n = int((t1 - t0 + rel) * SR)
    out = np.stack([sg.sosfilt(sos_bp(lo, hi), rng.standard_normal(n)) for _ in range(2)])
    out *= env_ar(n, att, t1 - t0, rel) * amp
    place(mus, t0, out)

def riser(t0, t1, amp=0.06):
    n = int((t1 - t0) * SR); t = np.arange(n) / SR
    w = rng.standard_normal(n); out = np.zeros(n); seg = int(0.05 * SR); zi = None
    for i in range(0, n, seg):
        fc = 300 * (14 ** (i / n))
        sos = sos_bp(fc * 0.7, fc * 1.4)
        if zi is None: zi = sg.sosfilt_zi(sos) * 0
        y, zi = sg.sosfilt(sos, w[i:i + seg], zi=zi); out[i:i + seg] = y
    out *= smoothstep(t / (t1 - t0)) ** 2 * amp
    place(mus, t0, out)

def crickets(t0, t1, amp=0.012):
    t = t0
    while t < t1:
        n = int(0.16 * SR); tt = np.arange(n) / SR
        s = np.sin(2 * np.pi * 4300 * tt) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 34 * tt))) * np.sin(np.pi * tt / 0.16)
        place(mus, t, s * amp, pan=rng.uniform(-0.8, 0.8)); t += rng.uniform(0.35, 0.9)

def theremin(t0, t1, amp=0.03):
    n = int((t1 - t0) * SR); t = np.arange(n) / SR
    f = 700 - 140 * smoothstep(t / (t1 - t0)) + 9 * np.sin(2 * np.pi * 5.2 * t)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ar(n, 1.2, t1 - t0 - 1.5, 1.5)
    place(mus, t0, s * amp, pan=0.1)

# ───────── 和弦 ─────────
Dm9 = [38, 45, 53, 60, 64]; Dm = [38, 45, 50, 53, 57]; Bbmaj7 = [34, 46, 50, 53, 57]; Gm9 = [43, 50, 53, 57, 58]
A7sus = [45, 52, 55, 62]; Fa = [41, 48, 53, 57, 60]; Cc = [36, 48, 55, 60, 64]; Ebmaj7 = [39, 46, 50, 55]; FA = [45, 53, 57, 60, 65]
DmajAdd9 = [38, 45, 50, 54, 57, 64]; Phryg = [38, 45, 51, 58]; Flyd = [41, 48, 52, 57, 59]; Bblyd = [46, 53, 57, 60, 64]; Eerie = [50, 56, 60, 65]
BbD = [38, 46, 50, 53]; GmD = [38, 43, 50, 55]

def S(n): return SC[n]['t0']
def E(n): return SC[n]['t1']

# ═══════ 开场 ═══════
drone(26, 0.0, 13.6, amp=0.10, att=3)
drone(38, 0.5, 13.6, amp=0.05, att=4)
noise_bed(0.0, 12.0, 400, 4000, 0.030, att=1.5, rel=2.0)                  # 雨声
pad(Dm, 1.0, 7.6, amp=0.07, att=2.5, rel=1.0, fc=500)
pad(Dm9, 7.4, 13.6, amp=0.11, att=0.6, rel=2.2, fc=700, fc2=2600, bright_t=1.5)
bell(midi(74), 7.62, amp=0.06); bell(midi(81), 7.72, amp=0.04, pan=0.4)
# ═══════ 一、起电 ═══════
c0 = S('charge')
chs = [(c0, Dm9), (c0 + 4.1, Bbmaj7), (c0 + 8.2, Gm9), (c0 + 12.3, A7sus)]
for i, (t, c) in enumerate(chs): pad(c, t, (chs[i + 1][0] if i < 3 else E('charge')) + 0.2, amp=0.11, att=1.0, rel=1.4, fc=1200)
arp(chs, c0 + 0.6, E('charge'), 60 / 72 / 2, amp=0.065, fade=1.5)
drone(26, c0, E('induct'), amp=0.06)
# 感应：张力渐增
c1 = S('induct')
chs = [(c1, Dm), (c1 + 3.5, BbD), (c1 + 7.0, GmD), (c1 + 10.5, A7sus)]
for i, (t, c) in enumerate(chs): pad(c, t, (chs[i + 1][0] if i < 3 else E('induct')) + 0.1, amp=0.1, att=0.8, rel=1.0, fc=900, fc2=1800, bright_t=3.5)
for k in range(int((E('induct') - c1) / (60 / 72 / 2))):
    tt = c1 + k * 60 / 72 / 2; g = 0.4 + 0.6 * k / 34
    pluck(midi(50), 0.07 * g, dur=0.5, bright=0.6, t0=tt)
arp(chs, c1 + 6.0, E('induct') - 0.3, 60 / 72 / 4, amp=0.03, fade=1.0, rise=1.2, lo=69, hi=93)
# 先导 → 回击 → 多次回击
p0 = S('process')
pad([69, 74, 81], p0 + 0.5, p0 + 7.9, amp=0.07, att=2.5, rel=0.3, fc=2600)
drone(26, p0, p0 + 7.9, amp=0.07, att=1, rel=0.4)
tc = p0 + 7.9
pad(Dm9, tc, tc + 4.0, amp=0.13, att=0.02, rel=1.0, fc=3000)
pad(Bbmaj7, tc + 4.0, tc + 7.7, amp=0.11, att=0.6, rel=1.0, fc=2400)
arp([(tc, Dm9), (tc + 4.0, Bbmaj7)], tc + 0.4, tc + 7.6, 60 / 72 / 4, amp=0.042, fade=0.6, lo=62, hi=88)
drone(26, tc, E('process'), amp=0.08, att=0.05)
r0 = p0 + 15.9
chs = [(r0, Gm9), (r0 + 3.4, A7sus), (r0 + 6.2, Dm)]
for i, (t, c) in enumerate(chs): pad(c, t, (chs[i + 1][0] if i < 2 else E('process')), amp=0.09, att=0.6, rel=1.4, fc=1500)
arp(chs, r0 + 0.3, p0 + 23.3, 60 / 72 / 2, amp=0.045, fade=0.8)
# 雷声
h0 = S('thunder')
pad([38, 45, 53], h0, E('thunder'), amp=0.08, att=1.5, rel=1.5, fc=600)
drone(26, h0, E('thunder'), amp=0.08)
riser(S('ch2') - 1.6, S('ch2') + 0.6, amp=0.05)
# ═══════ 二、类型 ═══════
g0 = S('cg')
chs = [(g0, Dm), (g0 + 3.2, Cc), (g0 + 6.4, Bbmaj7), (g0 + 9.6, A7sus)]
for i, (t, c) in enumerate(chs): pad(c, t, (chs[i + 1][0] if i < 3 else E('cg')) + 0.1, amp=0.085, att=0.4, rel=1.0, fc=1500)
arp(chs, g0 + 0.4, E('cg'), 60 / 72 / 4, amp=0.032, fade=0.8, pattern=(0, 2, 1, 3, 2, 4, 3, 1))
for k in range(int((E('cg') - g0 - 0.4) / (60 / 72))): kick(g0 + 0.4 + k * 60 / 72, 0.16 if k % 4 else 0.22)
i0 = S('icc')
chs = [(i0, Bbmaj7), (i0 + 4.9, FA)]
for i, (t, c) in enumerate(chs): pad(c, t, (chs[i + 1][0] if i < 1 else E('icc')) + 0.1, amp=0.11, att=0.8, rel=1.2, fc=2000)
arp(chs, i0 + 0.5, E('icc'), 60 / 72 / 4, amp=0.036, lo=74, hi=98, pattern=(0, 3, 1, 4, 2, 5), bright=1.3)
l0 = S('look')
chs = [(l0, Gm9), (l0 + 4.2, Ebmaj7), (l0 + 8.1, Dm9)]
for i, (t, c) in enumerate(chs): pad(c, t, (chs[i + 1][0] if i < 2 else E('look')) + 0.1, amp=0.085, att=0.6, rel=1.2, fc=1600)
arp(chs, l0 + 0.3, E('look'), 60 / 72 / 2, amp=0.045, fade=0.8)
for k in range(int((E('look') - l0) / (60 / 72 * 2))): kick(l0 + 0.3 + k * 60 / 72 * 2, 0.12)
d0 = S('heatdry')
pad(FA, d0, d0 + 5.0, amp=0.09, att=1.2, rel=1.0, fc=1100)
crickets(d0 + 0.3, d0 + 5.0)
pad([43, 50, 55, 58], d0 + 4.8, E('heatdry'), amp=0.08, att=0.8, rel=1.0, fc=900)
drone(26, d0 + 4.8, E('volcano'), amp=0.07, att=1)
v0 = S('volcano')
pad(Phryg, v0, E('volcano'), amp=0.09, att=0.6, rel=1.4, fc=800, fc2=1600, bright_t=5)
for k in range(int((E('volcano') - v0) / (60 / 72 / 2))): pluck(midi(26 + (1 if k % 8 == 7 else 0) + 12), 0.07, dur=0.45, bright=0.4, t0=v0 + k * 60 / 72 / 2)
t0_ = S('tle')
pad(Flyd, t0_, t0_ + 7.4, amp=0.1, att=1.8, rel=1.6, fc=2600)
pad(Bblyd, t0_ + 7.4, E('tle'), amp=0.1, att=1.4, rel=1.6, fc=2600)
noise_bed(t0_, E('tle'), 3000, 9000, 0.008, att=2, rel=1.5)
arp([(t0_, Flyd), (t0_ + 7.4, Bblyd)], t0_ + 1.0, E('tle') - 0.5, 60 / 72 * 2 / 3, amp=0.045, lo=76, hi=100, pattern=(0, 2, 4, 1, 3, 5), bright=0.6, dur=2.2)
b0 = S('ball')
n = int((E('ball') - b0 + 1.5) * SR); tt = np.arange(n) / SR
pad(Eerie, b0, E('ball'), amp=0.1, att=1.5, rel=1.5, fc=1200)
place(mus, b0, (np.sin(2 * np.pi * 7 * tt) * 0.5 + 0.5) * 0)   # 占位（保持结构清晰）
theremin(b0 + 1.0, E('ball') - 0.5, amp=0.05)
arp([(b0, Eerie)], b0 + 1.2, E('ball') - 0.6, 60 / 72, amp=0.035, lo=62, hi=84, pattern=(0, 2, 1, 3), bright=0.5, dur=1.6)
drone(26, b0, E('ball'), amp=0.05)
# ═══════ 三、安全 · 结尾 ═══════
pad(Fa, S('ch3'), S('dist') + 0.6, amp=0.1, att=0.6, rel=1.0, fc=1500)
s0 = S('dist')
pad(Dm, s0, E('dist'), amp=0.1, att=1.0, rel=1.0, fc=1300)
f0 = S('safe')
chs = [(f0, Fa), (f0 + 2.1, Cc), (f0 + 4.2, Dm), (f0 + 6.2, Bbmaj7)]
for i, (t, c) in enumerate(chs): pad(c, t, (chs[i + 1][0] if i < 3 else E('safe')) + 0.1, amp=0.12, att=0.5, rel=1.0, fc=1900)
arp(chs, f0 + 0.3, E('safe'), 60 / 72 / 2, amp=0.06, fade=0.8)
e0 = S('end')
final = [h['t'] for h in TL['hits'] if h['kind'] == 'final'][0]
pad(Bbmaj7, e0, e0 + 3.5, amp=0.11, att=0.8, rel=1.0, fc=1400)
pad(Cc, e0 + 3.5, final, amp=0.11, att=0.8, rel=0.3, fc=1500, fc2=2400, bright_t=3)
arp([(e0, Bbmaj7), (e0 + 3.5, Cc)], e0 + 0.4, final - 0.4, 60 / 72 / 4, amp=0.03, fade=0.8, rise=1.0)
pad(DmajAdd9, final, 180.0, amp=0.12, att=0.05, rel=3.0, fc=2800)
drone(26, e0, 180.0, amp=0.08, att=2, rel=3)
for k, m in enumerate((74, 78, 81, 86)): bell(midi(m), final + 0.05 + k * 0.18, amp=0.05, dur=4, pan=(k - 1.5) * 0.3)

# ═══════ 同步音效 ═══════
for h in TL['hits']:
    t, s, k = h['t'], h['s'], h['kind']
    if k == 'strike': thunder(t, s, crack=True, length=4.0 + 2.0 * s)
    elif k == 'final': thunder(t, 1.0, crack=True, length=6.0)
    elif k == 'boom': thunder(t, s, crack=True, length=2.5, sub=True)
    elif k == 'cut': thunder(t, s * 0.8, crack=True, length=0.7, sub=False)
    elif k == 'rumble': thunder(t, s * 0.7, crack=False, length=4.5, delay=0.0, near=False)
    elif k == 'soft': soft_hit(t, s)
    elif k == 'tick': tick(t, s * 3)
    elif k == 'shimmer': shimmer(t, s)
    elif k == 'crackle': crackle(t, 0.05)
    elif k == 'pop': pop(t, s)
    # 'silent' / 'flashonly'：远处的闪电，听不到雷声 —— 故意不发声

# ═══════ 混响与总混 ═══════
def reverb_ir(sec, damp_hz, seed):
    r = np.random.default_rng(seed); n = int(sec * SR); t = np.arange(n) / SR
    ir = np.stack([sg.sosfilt(sos_lp(damp_hz), r.standard_normal(n)) * np.exp(-t * 6.9 / sec) for _ in range(2)])
    ir[:, :int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    return ir / np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
ir1, ir2 = reverb_ir(3.4, 5000, 1), reverb_ir(1.8, 3500, 2)
wet_m = np.stack([sg.oaconvolve(mus[c], ir1[c])[:N] for c in (0, 1)])
wet_f = np.stack([sg.oaconvolve(fx[c], ir2[c])[:N] for c in (0, 1)])
MG = 10 ** (3 / 20)   # 配乐相对音效提高 3 dB
out = (mus * 0.75 + wet_m * 0.55) * MG + fx * 0.9 + wet_f * 0.42 + dry
out = np.stack([sg.sosfilt(sos_hp(24), out[c]) for c in (0, 1)])
out = out[:, :int(DUR * SR)]
t = np.arange(out.shape[1]) / SR
out *= smoothstep(t / 0.8) * (1 - smoothstep((t - (DUR - 2.2)) / 2.2))
from scipy.ndimage import maximum_filter1d
import pyloudnorm as pyln
def compress(x, thr_db=-24, ratio=2.5, tau=0.08):
    p = (x ** 2).mean(axis=0); a = np.exp(-1 / (tau * SR))
    env = np.sqrt(sg.lfilter([1 - a], [1, -a], p) + 1e-12)
    db = 20 * np.log10(env); over = np.maximum(0, db - thr_db)
    g = 10 ** (-over * (1 - 1 / ratio) / 20)
    return x * g
def limit(x, ceil=10 ** (-1.5 / 20), look=0.005, rel=0.08):
    L = int(look * SR); pk = maximum_filter1d(np.abs(x).max(axis=0), size=2 * L + 1)
    g = np.minimum(1, ceil / (pk + 1e-12))
    a = np.exp(-1 / (rel * SR)); g = -sg.lfilter([1 - a], [1, -a], -g)   # 释放平滑
    g = np.minimum(g, ceil / (pk + 1e-12))
    return x * g
out /= np.abs(out).max()
out = compress(out)
meter = pyln.Meter(SR)
for _ in range(3):   # 增益 → 限幅，迭代逼近 −13 LUFS
    lufs = meter.integrated_loudness(out.T)
    out = limit(out * 10 ** ((-13.0 - lufs) / 20))
lufs = meter.integrated_loudness(out.T)
print('integrated LUFS', round(lufs, 2), 'sample peak dBFS', round(20 * np.log10(np.abs(out).max()), 2))
import wave
pcm = (np.clip(out.T, -1, 1) * 32767).astype('<i2')
with wave.open('build/music.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote build/music.wav', out.shape[1] / SR, 's')
