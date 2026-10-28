"""Verify the actual PPTX/PDF artifacts, not just the generation code."""
from pathlib import Path
from collections import Counter
from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE_TYPE
from lxml import etree
import fitz, zipfile, re, json
root=Path(__file__).resolve().parent.parent
prs=Presentation(root/'大脑记忆工厂.pptx')
assert len(prs.slides)==22
assert abs(prs.slide_width/prs.slide_height-16/9)<0.001
counts=Counter();out=[];times=[];small=[]
for i,s in enumerate(prs.slides,1):
    assert s.has_notes_slide
    notes=s.notes_slide.notes_text_frame.text
    m=re.search(r'【建议用时】(\d+):(\d+)',notes)
    assert m,(i,'missing timing')
    times.append(int(m[1])*60+int(m[2]))
    for sh in s.shapes:
        counts[str(sh.shape_type)]+=1
        if min(sh.left,sh.top)<0 or sh.left+sh.width>prs.slide_width+1000 or sh.top+sh.height>prs.slide_height+1000:out.append([i,sh.name])
        if sh.has_text_frame:
            for para in sh.text_frame.paragraphs:
                for r in para.runs:
                    if r.font.size and r.font.size.pt<16 and sh.top>prs.slide_height*.09 and sh.top<prs.slide_height*.94:small.append([i,r.text,r.font.size.pt])
assert not out,out
assert not small,small
assert sum(times)==2400,sum(times)
assert counts['CHART (3)']==1
native=counts['AUTO_SHAPE (1)']+counts['CHART (3)']
with zipfile.ZipFile(root/'大脑记忆工厂.pptx') as z:
    assert z.testzip() is None
    xmls=[n for n in z.namelist() if n.endswith('.xml')]
    for n in xmls:etree.fromstring(z.read(n))
    assert any(n.startswith('ppt/embeddings/') and n.endswith('.xlsx') for n in z.namelist())
    pngs=[n for n in z.namelist() if n.startswith('ppt/media/') and n.endswith('.png')]
    assert all(z.read(n).startswith(b'\x89PNG\r\n\x1a\n') for n in pngs),'invalid PNG fallback'
    chart=z.read('ppt/charts/chart1.xml').decode()
    assert '<c:lineChart>' in chart and '<c:smooth val="1"' in chart
pdf=fitz.open(root/'大脑记忆工厂.pdf')
assert len(pdf)==22
assert len(list((root/'previews').glob('slide-*.png')))==22
assert len(list((root/'previews').glob('contact-*.jpg')))==4
for i,page in enumerate(pdf):
    assert len(page.get_text().strip())>35,(i,'text missing')
report={'slides':len(prs.slides),'aspectRatio':'16:9','durationSeconds':sum(times),'teacherNotes':22,'nativeObjects':native,'svgPictureObjects':counts['PICTURE (13)'],'nativeObjectPercentage':round(native/sum(counts.values())*100,1),'nativeEditableCharts':1,'embeddedChartWorkbooks':1,'outOfBoundsObjects':out,'undersizedContentText':small,'genuinePngFallbacks':len(pngs),'xmlPartsParsed':len(xmls),'pdfPagesRendered':len(pdf),'previewPNGs':22,'contactSheets':4,'visualReview':'All 22 pages reviewed; slides 06, 14, 15 and 18 revised and re-rendered.','renderEngine':'LibreOffice Impress 25.2.3; PyMuPDF 1.5x rasterization','powerPointDesktopTested':False}
(root/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
