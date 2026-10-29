# Newspaper photos for the Touchline Gazette, cut from the approved V2 plates (no repaint, no filters).
# Run from visual-assets/v10_1/: python3 content/gazette/crop_photos.py

from PIL import Image
P='plates-v2/ENV_%s_PLATE_V2_2X.webp'
OUT='content/gazette/'
# name: (plate, x0, y0, x1, y1) in 1X px (1536x864), output width
CROPS={
 'GZ_LEAD_SEASON':('STANDINGS',0,40,1536,808,960),
 'GZ_LEAD_DRAW':('RIVALRY',0,40,1536,808,960),
 'GZ_LEAD_FINAL':('FINAL_WINNER',0,30,1536,798,960),
 'GZ_LEAD_GOLD':('TROPHY_ROOM',0,30,1536,798,960),
 'GZ_LEAD_PRESS':('HOME',560,20,1536,508,960),
 'GZ_WIN_DANIEL':('SEASON_RESULTS',40,60,460,585,480),
 'GZ_WIN_NIK':('SEASON_RESULTS',1034,60,1454,585,480),
 'GZ_THINK_DANIEL':('STATISTICS',50,40,470,565,480),
 'GZ_THINK_NIK':('STATISTICS',1010,60,1430,585,480),
}
for k,(pl,x0,y0,x1,y1,w) in CROPS.items():
    im=Image.open(P%pl).convert('RGB').crop((x0*2,y0*2,x1*2,y1*2))
    im=im.resize((w,round(w*im.height/im.width)),Image.LANCZOS)
    im.save(OUT+k+'.webp',quality=82,method=6)
    print(k,im.size)
