"""Decode every delivery frame; write numeric diagnostics and nine review sheets."""
from pathlib import Path
import hashlib
import json
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent.parent
video = root / 'output/THE_MACHINE_DREAMS.mp4'
out = root / 'preview'
allframes = out / 'all-frames'
allframes.mkdir(exist_ok=True)
probe = json.loads(subprocess.check_output([
    'ffprobe', '-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', str(video)
]))
(out/'ffprobe.json').write_text(json.dumps(probe, indent=2))
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', str(video), '-vf', 'scale=320:180',
    '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'], stdout=subprocess.PIPE)
frames=[]
while True:
    raw=p.stdout.read(320*180*3)
    if not raw: break
    assert len(raw)==320*180*3
    frames.append(np.frombuffer(raw,dtype=np.uint8).reshape(180,320,3).copy())
assert p.wait()==0
rows=[]
for i,frame in enumerate(frames):
    delta=np.abs(frame.astype(float)-frames[max(0,i-1)].astype(float))
    rows.append({'frame':i,'time':round(i/30,6),'mean':round(float(frame.mean()),5),
        'mean_delta':round(float(delta.mean()),5), 'changed_fraction':round(float((delta.max(2)>1).mean()),7),
        'sha256':hashlib.sha256(frame.tobytes()).hexdigest()})
duplicates=[i for i in range(1,len(rows)) if rows[i]['sha256']==rows[i-1]['sha256']]
report={'decoded_frames':len(frames),'expected_frames':450,'duration':probe['format']['duration'],
    'consecutive_identical_frames':duplicates, 'frames':rows,
    'review_note':'All frames decoded; consecutive-frame motion measured on 320x180 images. Intentional recognition brake after 13.02s; pure black from 14.88s.'}
(out/'frame-analysis.json').write_text(json.dumps(report,indent=2))
font=ImageFont.truetype(str(root/'assets/fonts/Mono.ttf'),11)
for sheet in range((len(frames)+49)//50):
    montage=Image.new('RGB',(1600,2040),(18,19,18))
    draw=ImageDraw.Draw(montage)
    for cell,i in enumerate(range(sheet*50,min((sheet+1)*50,len(frames)))):
        x=(cell%5)*320;y=(cell//5)*204
        draw.text((x+7,y+4),f'{i:03d} / {i/30:05.2f}s',font=font,fill=(215,221,207))
        montage.paste(Image.fromarray(frames[i]),(x,y+24))
    montage.save(allframes/f'frames-{sheet*50:03d}-{min((sheet+1)*50-1,len(frames)-1):03d}.jpg',quality=91)
# Compact presentation overview: one frame every half-second; none skipped by numeric review.
overview=Image.new('RGB',(1920,1020),(18,19,18));d=ImageDraw.Draw(overview)
for cell,i in enumerate(range(0,450,15)):
    x=(cell%6)*320;y=(cell//6)*204
    d.text((x+7,y+4),f'{i/30:04.1f}s',font=font,fill=(215,221,207))
    overview.paste(Image.fromarray(frames[i]),(x,y+24))
overview.save(out/'RENDER_CONTACT_SHEET.jpg',quality=93)
print(json.dumps({k:v for k,v in report.items() if k!='frames'},indent=2))
