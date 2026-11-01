"""Optional art source: python3 scripts/generate-chat-art.py (requires Pillow).
Tiny original vector-style GIFs and posters; no external media requests at runtime.
"""
from pathlib import Path
import math
from PIL import Image, ImageDraw, ImageFont

out = Path(__file__).resolve().parent.parent / 'public' / 'chat-art'
out.mkdir(exist_ok=True)
font_path = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
font = ImageFont.truetype(font_path, 22)

def star(cx, cy, radius, phase=0):
    return [(cx + math.cos(i * math.pi / 5 - math.pi / 2 + phase) * radius * (1 if i % 2 == 0 else .46),
             cy + math.sin(i * math.pi / 5 - math.pi / 2 + phase) * radius * (1 if i % 2 == 0 else .46)) for i in range(10)]

for kind, label in [('celebrate', 'LEVEL UP!'), ('heart', 'GOOD VIBES'), ('star', 'GREAT MOVE')]:
    frames = []
    for frame in range(16):
        image = Image.new('RGB', (240, 144), '#192340')
        d = ImageDraw.Draw(image)
        d.rounded_rectangle((7, 7, 232, 136), radius=20, fill='#342452' if kind == 'heart' else '#143b50', outline='#5d648b', width=1)
        phase = frame / 16 * math.pi * 2
        for i in range(15):
            x = (i * 73 + 17) % 215 + 12
            y = (i * 37 + frame * (2 if kind == 'celebrate' else 1)) % 116 + 12
            color = ['#7ae8cf', '#ffce72', '#f88eb9', '#94bbff'][i % 4]
            if i % 3:
                d.rectangle((x, y, x + 3, y + 5), fill=color)
            else:
                d.polygon(star(x, y, 4), fill=color)
        cx, cy = 120, 54 + math.sin(phase) * 3
        if kind == 'heart':
            radius = 28 + math.sin(phase) * 2
            points = []
            for i in range(90):
                t = i / 90 * math.pi * 2
                points.append((cx + radius * math.sin(t) ** 3, cy - radius * (.8125 * math.cos(t) - .3125 * math.cos(2*t) - .125 * math.cos(3*t) - .0625 * math.cos(4*t))))
            d.polygon([(x + 2, y + 5) for x, y in points], fill='#6f306e')
            d.polygon(points, fill='#fc83c5')
            d.ellipse((105, 42, 113, 49), fill='#ffd3ec')
        else:
            d.polygon(star(cx + 2, cy + 5, 32), fill='#a5683e')
            d.polygon(star(cx, cy, 32), fill='#ffe38d')
            d.line((109, 46, 114, 41), fill='#fff7db', width=3)
            d.ellipse((109, 52, 112, 56), fill='#593c65')
            d.ellipse((128, 52, 131, 56), fill='#593c65')
            d.arc((112, 53, 128, 65), 0, 180, fill='#593c65', width=2)
        width = d.textlength(label, font=font)
        d.rounded_rectangle((120-width/2-10, 99, 120+width/2+10, 127), radius=8, fill='#0c273b')
        d.text((120-width/2, 98), label, font=font, fill='#fff3c8')
        frames.append(image.quantize(colors=64))
    frames[0].convert('RGB').save(out / (kind + '.png'), optimize=True)
    frames[0].save(out / (kind + '.gif'), save_all=True, append_images=frames[1:], duration=100, loop=0, optimize=True)
    print(kind, (out / (kind + '.gif')).stat().st_size)
