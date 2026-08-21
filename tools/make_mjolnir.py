"""Mjolnir sprite, drawn to match the hammer already in thor.png.
Run with: python3 tools/make_mjolnir.py"""
from PIL import Image

W, H, SCALE = 18, 16, 3
T=(0,0,0,0); K=(20,18,24,255)
M=(150,158,172,255)   # steel
Ml=(206,214,228,255)  # lit face
Md=(96,104,120,255)   # shadowed face
B=(104,68,42,255)     # leather grip
Bl=(146,100,62,255)
S=(214,226,240,255)   # sheen

g = [[T]*W for _ in range(H)]
def rect(x0,y0,x1,y1,c):
    for y in range(y0,y1+1):
        for x in range(x0,x1+1):
            if 0<=x<W and 0<=y<H: g[y][x]=c

rect(1,3,11,12,M)        # head
rect(1,3,11,4,Ml)        # lit top face
rect(1,11,11,12,Md)      # shadowed underside
rect(2,5,4,7,S)          # sheen on the striking face
rect(10,5,11,10,Md)
rect(12,6,16,9,Bl)       # handle
rect(12,8,16,9,B)
rect(15,5,17,10,B)       # thong at the end

filled=[[g[y][x][3]>0 for x in range(W)] for y in range(H)]
for y in range(H):
    for x in range(W):
        if filled[y][x]: continue
        if any(0<=x+dx<W and 0<=y+dy<H and filled[y+dy][x+dx]
               for dx,dy in ((1,0),(-1,0),(0,1),(0,-1))):
            g[y][x]=K

im=Image.new("RGBA",(W,H)); im.putdata([g[y][x] for y in range(H) for x in range(W)])
im.resize((W*SCALE,H*SCALE),Image.NEAREST).save("images/mjolnir.png")
print(f"mjolnir.png {W*SCALE}x{H*SCALE}")
