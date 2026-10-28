"""Render an existing PDF export and produce overview contact sheets.
Requires PyMuPDF and Pillow; export PPTX using LibreOffice first.
"""
from pathlib import Path
import fitz
from PIL import Image, ImageOps, ImageDraw
root=Path(__file__).resolve().parent.parent
out=root/'previews';out.mkdir(exist_ok=True)
doc=fitz.open(root/'大脑记忆工厂.pdf')
for i,page in enumerate(doc):
    pm=page.get_pixmap(matrix=fitz.Matrix(1.5,1.5),alpha=False)
    pm.save(out/f'slide-{i+1:02}.png')
for start in range(0,len(doc),6):
    canvas=Image.new('RGB',(1920,1704),'#DFDFEB')
    d=ImageDraw.Draw(canvas)
    for j in range(min(6,len(doc)-start)):
        im=Image.open(out/f'slide-{start+j+1:02}.png').resize((948,533))
        x=8+j%2*960;y=24+j//2*568
        canvas.paste(im,(x,y));d.text((x,y-17),f'{start+j+1:02}',fill='#36369B')
    canvas.save(out/f'contact-{start+1:02}-{min(start+6,len(doc)):02}.jpg',quality=90)
print('Rendered',len(doc),'pages')
