"""Deterministic cloth, wooden hoof taps, small bottle clinks and two generic TTS lines."""
from pathlib import Path
import subprocess
import wave
import numpy as np
ROOT=Path(__file__).resolve().parent.parent
RATE=48000; DURATION=15
n=RATE*DURATION;t=np.arange(n)/RATE
rng=np.random.default_rng(4004);noise=rng.standard_normal(n)
soft=np.convolve(noise,np.ones(16)/16,mode='same')
audio=np.zeros((n,2))
# A quiet sea breath, no music.
sea=.006*soft*(.65+.35*np.sin(t*.8))
audio[:,0]+=sea;audio[:,1]+=np.roll(sea,73)
def hit(at,amp=.12,pitch=260,decay=35,pan=0,kind='wood'):
    lo=max(0,int(at*RATE));hi=min(n,lo+int(.35*RATE));u=np.arange(hi-lo)/RATE
    if kind=='wood':
        sig=(np.sin(2*np.pi*pitch*u)+.4*np.sin(2*np.pi*pitch*2.7*u)+noise[lo:hi]*.32)*np.exp(-u*decay)
    elif kind=='cloth':sig=soft[lo:hi]*np.sin(np.pi*np.clip(u/.22,0,1))**2*np.exp(-u*8)
    elif kind=='boing':sig=np.sin(2*np.pi*(pitch*u+30*(1-np.exp(-u*9))))*np.exp(-u*15)
    else:sig=(np.sin(2*np.pi*pitch*u)+.2*np.sin(2*np.pi*pitch*2.1*u))*np.exp(-u*decay)
    audio[lo:hi,0]+=sig*amp*(1-pan*.35);audio[lo:hi,1]+=sig*amp*(1+pan*.35)
for i,at in enumerate([1.21,2.38,2.58,2.82,3.14,3.45,3.83]):hit(at,.15,kind='cloth',pan=(-1)**i*.4)
for i in range(22):
    at=4.2+i*np.pi/6.9
    if at>14.8:break
    if 11.9<at<12.8:continue
    amp=.06+min(.10,(at-4.2)*.018)
    hit(at,amp,245+(i%3)*31,38,(-1)**i*.4)
    if at>6.2:hit(at+.075,.027,1300+(i%4)*110,30,(-1)**i*.6,'glass')
for at in [5.05,6.9,8.2,9.55,12.94,13.82]:hit(at,.055,110,kind='boing')
hit(12.28,.07,330,50,-.4)
for filename,start,gain in [('praise.mp3',.95,.72),('deny.mp3',3.05,.76)]:
    path=ROOT/'assets'/filename
    if path.stat().st_size==0:raise RuntimeError('Voice file is empty: '+filename)
    raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-f','f32le','-ar',str(RATE),'-ac','2','-'])
    line=np.frombuffer(raw,dtype='<f4').reshape(-1,2).copy()
    peak=np.max(np.abs(line));line=line/max(peak,.01)*.50*gain
    offset=int(start*RATE);end=min(n,offset+len(line));audio[offset:end]+=line[:end-offset]
    print(filename, 'duration',round(len(line)/RATE,3),'placed at',start)
# Soft limiting and short, clean edges.
audio=np.tanh(audio*1.4)*.89
edge=np.minimum(np.clip(t/.08,0,1),np.clip((15-t)/.08,0,1))
audio*=edge[:,None]
path=ROOT/'assets/performance.wav'
with wave.open(str(path),'wb') as f:
    f.setnchannels(2);f.setsampwidth(2);f.setframerate(RATE);f.writeframes((audio*32767).astype('<i2').tobytes())
print(path)
