# relight one plate. usage: run_room.py in.webp out.png 'dirs_json' [faces_json]  -> also writes out_compare.jpg of heads
import sys, json; sys.path.insert(0, sys.argv[0].rsplit('/',1)[0])
import numpy as np; from PIL import Image
from heads import find, heads
from relight import relight
src, dst, cfg = sys.argv[1], sys.argv[2], json.loads(sys.argv[3])
img = np.asarray(Image.open(src).convert('RGB')).copy()
faces = json.loads(sys.argv[4]) if len(sys.argv)>4 else find(img)
assert len(faces)==2, faces
mask, hs = heads(img, faces)
res = img
for i,(h, c) in enumerate(zip(hs, cfg)):
    h['others']=[o['face'] for j,o in enumerate(hs) if j!=i]   # cfg = [Daniel, Nik]: {lamp:[dx,dy], keep:x, tint:[r,g,b]?}
    h.update(c); res = relight(res, mask, h)
Image.fromarray(res).save(dst)
tiles=[]
for h in hs:
    x0,y0,x1,y1 = h['box']; a=Image.fromarray(img).crop(h['box']); b=Image.fromarray(res).crop(h['box'])
    t=Image.new('RGB',(a.width*2,a.height)); t.paste(a,(0,0)); t.paste(b,(a.width,0))
    t=t.resize((800,int(800*t.height/t.width))); tiles.append(t)
c=Image.new('RGB',(800,sum(t.height for t in tiles))); y=0
for t in tiles: c.paste(t,(0,y)); y+=t.height
c.save(dst.rsplit('.',1)[0]+'_cmp.jpg', quality=90)
print(dst, faces)
