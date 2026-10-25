"""Minimal deterministic sound design. No music or recorded samples."""
from pathlib import Path
import wave
import numpy as np

RATE = 48000
t = np.arange(RATE * 15) / RATE
rng = np.random.default_rng(81)
noise = rng.standard_normal(len(t))
env = np.minimum(t / .7, 1) * np.clip((14.84 - t) / .24, 0, 1)
breath = .75 + .25 * np.sin(t * 1.63)
hum = .043 * np.sin(2 * np.pi * (43 * t + .18 * np.sin(t * .6)))
hum += .014 * np.sin(2 * np.pi * 86.03 * t) * breath
hum += .005 * noise
left = hum * env
right = hum * env

def click(at, amp=.1, pitch=1800, pan=0):
    global left, right
    dt = t - at
    mask = (dt >= 0) & (dt < .12)
    u = dt[mask]
    pulse = (np.sin(2 * np.pi * pitch * u * np.exp(-u * 19)) + .4 * noise[mask]) * np.exp(-u * 110) * amp
    left[mask] += pulse * (1 - pan * .5)
    right[mask] += pulse * (1 + pan * .5)

for i, at in enumerate(np.arange(.2, 6, .24)):
    drift = 0 if at < 3.1 else .045 * np.sin(i * 1.7)
    click(at + drift, .052 if at < 3.1 else .073, 2200 + i * 37, np.sin(i) * .7)
click(3.22, .16, 950, -.6)
click(3.267, .08, 1320, .5)
for at in [5.1, 6.18, 7.2, 7.27, 8.36, 9.68, 10.22, 10.265, 11.82, 12.35]:
    click(at, .08, 700 + at * 120, np.sin(at) * .8)
for start, strength in [(6.3,.07),(10.0,.09),(11.9,.16)]:
    dt = np.maximum(0,t-start)
    a = (t>=start) * np.exp(-dt*1.8) * (1-np.exp(-dt*14))
    sub = strength*np.sin(2*np.pi*(31*dt+14*(1-np.exp(-dt*2))))*a
    left += sub; right += sub
travel=np.exp(-((t-12.5)/.34)**2)
band = noise - np.roll(noise,1)
left += .022*travel*band*(.6+.4*np.sin(t*37))
right += .022*travel*np.roll(band,29)
brake=1-.88*np.clip((t-13.03)/.13,0,1)
left*=brake;right*=brake
click(14.12,.07,1800,0)
end=np.clip((14.89-t)/.12,0,1)
stereo=np.stack([left*end,right*end],axis=1)
stereo=np.tanh(stereo*1.8)*.82
path=Path(__file__).resolve().parent.parent/'assets/machine-dream.wav'
with wave.open(str(path),'wb') as f:
    f.setnchannels(2);f.setsampwidth(2);f.setframerate(RATE)
    f.writeframes((stereo*32767).astype('<i2').tobytes())
print(path)
