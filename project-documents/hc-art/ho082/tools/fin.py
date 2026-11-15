import json, numpy as np, sys, math
from PIL import Image
sys.path.insert(0,'../ho081')
import importlib.util
spec=importlib.util.spec_from_file_location('f81','../ho081/fin.py')
src81=open('../ho081/fin.py').read().split('def xf')[0]
exec(src81)  # defines decon
R=Image.fromarray(np.load('R.npy'),'RGBA'); Q=json.load(open('Q.json'))
L,T,Rx,B=620,640,1900,1600
c=R.crop((L,T,Rx,B)); s=1600/(Rx-L)
c=c.resize((1600,1200),Image.LANCZOS)
a=np.array(c); a[:,-1,3]=np.where(a[:,-2,3]>128,255,a[:,-1,3]); c=Image.fromarray(a,'RGBA')
c=decon(c)
fx=lambda p:[round((p[0]-L)*s/1600,4), round(1-(p[1]-T)*s/1200,4)]
al=np.array(c)[...,3]
ys=np.where(al[:,-1]>128)[0]
num={'canvas':[1600,1200],'yFrom':'bottom','muzzle':fx(Q['muzzle']),'boreRear':fx(Q['boreRear']),'wrist':fx(Q['wrist'])}
m,b=Q['muzzle'],Q['boreRear']; num['boreAngleDeg']=round(math.degrees(math.atan2(b[1]-m[1],b[0]-m[0])),1)
num['cut']=[[1.0,round(1-ys.min()/1200,4)],[1.0,round(1-ys.max()/1200,4)]]
# elbow direction: sleeve centre line from wrist to cut midpoint
cm=[1.0,(num['cut'][0][1]+num['cut'][1][1])/2]
num['elbowDirection']={'from':num['wrist'],'toward':cm,'angleAboveHorizontalDeg':round(math.degrees(math.atan2((num['wrist'][1]-cm[1])*1200,(1-num['wrist'][0])*1600)),1)}
# glove box: opaque bbox in region between cylinder bottom and wrist
sub=al[:, :int(num['wrist'][0]*1600)]
rows=np.where((sub>128).any(1))[0]
gl=al[int(0.45*1200):, :int(num['wrist'][0]*1600)+20]
yy,xx=np.where(gl>128); x0,x1,y0,y1=xx.min(),xx.max(),yy.min()+int(0.45*1200),yy.max()+int(0.45*1200)
num['gloveBox']={'x0':round(x0/1600,3),'x1':round(x1/1600,3),'yTop':round(1-y0/1200,3),'yBottom':round(1-y1/1200,3)}
edges={k:bool(v) for k,v in {'left':(al[:,0]>8).any(),'top':(al[0]>8).any(),'bottom':(al[-1]>8).any()}.items()}
num['touchesOtherEdges']=edges
json.dump(num,open('HO082_PLATE_NUMBERS.json','w'),indent=1); print(json.dumps(num,indent=1))
c.save('RR_HAND_POV_S_V1.webp',quality=86,alpha_quality=100,method=6)
bg=Image.new('RGBA',c.size,(18,14,12,255)); bg.alpha_composite(c); bg.convert('RGB').save('PREVIEW_S_ON_DARK.jpg',quality=88)
